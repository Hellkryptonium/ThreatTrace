import type { RawAttachment, AttachmentPayloadAnalysis, PayloadVerdict, PayloadIndicator, Finding } from "../../../types/email.js";
import crypto from "node:crypto";
import { detectFileType, checkExtensionMismatch, hasDoubleExtension, hasRtloCharacter } from "./file-signatures.js";
import { analyzePdf } from "./pdf-analyzer.js";
import { analyzeOfficeDocument } from "./office-analyzer.js";
import { analyzeArchive } from "./archive-analyzer.js";
import { analyzeImage } from "./image-analyzer.js";
import { runYaraRules } from "./yara-rules.js";
import { checkFileHash } from "./virustotal-file.service.js";
import { scanWithClamAv } from "./clamav.service.js";
import path from "node:path";

function severityToScore(severity: string): number {
  switch (severity) {
    case "CRITICAL": return 30;
    case "HIGH": return 20;
    case "MEDIUM": return 10;
    case "LOW": return 5;
    default: return 0;
  }
}

async function analyzeOneAttachment(attachment: RawAttachment): Promise<{ analysis: AttachmentPayloadAnalysis; findings: Finding[]; extractedUrls: string[] }> {
  const buffer = attachment.content;
  const filename = attachment.filename;
  const ext = path.extname(filename).toLowerCase();
  const indicators: PayloadIndicator[] = [];
  let allExtractedUrls: string[] = [];
  let metadata: AttachmentPayloadAnalysis["metadata"] = {};

  // 1. File type detection
  const fileType = detectFileType(buffer);
  const detectedContentType = fileType.detectedType;

  // 2. Extension mismatch check
  const mismatchResult = checkExtensionMismatch(filename, detectedContentType);
  const extensionMismatch = mismatchResult.mismatch;
  const doubleExt = hasDoubleExtension(filename);
  const rtlo = hasRtloCharacter(filename);

  if (extensionMismatch) {
    indicators.push({ rule: "EXTENSION_MISMATCH", severity: "HIGH", description: `File extension '${mismatchResult.declaredExt}' does not match detected type '${detectedContentType}' (expected '${mismatchResult.expectedExt}')` });
  }
  if (doubleExt) {
    indicators.push({ rule: "DOUBLE_EXTENSION", severity: "MEDIUM", description: `Filename '${filename}' uses a double extension, a common social engineering technique` });
  }
  if (rtlo) {
    indicators.push({ rule: "RTLO_CHARACTER", severity: "CRITICAL", description: "Filename contains a Right-to-Left Override character used to disguise the true extension" });
  }

  // 3. Format-specific deep analysis
  try {
    if (detectedContentType === "application/pdf") {
      const pdfResult = analyzePdf(buffer);
      indicators.push(...pdfResult.indicators.map((i) => ({ rule: i.rule, severity: i.severity, description: i.description, detail: i.detail })));
      allExtractedUrls.push(...pdfResult.extractedUrls);
      metadata.pdf = {
        title: pdfResult.title,
        author: pdfResult.author,
        producer: pdfResult.producer,
        creationDate: pdfResult.creationDate,
        hasJavaScript: pdfResult.hasJavaScript,
        hasLaunchAction: pdfResult.hasLaunchAction,
        hasAutoAction: pdfResult.hasAutoAction,
        hasEmbeddedFiles: pdfResult.hasEmbeddedFiles,
        formCount: pdfResult.formCount,
        suspiciousFilters: pdfResult.suspiciousFilters,
      };
    } else if (detectedContentType === "application/zip" || detectedContentType.startsWith("application/vnd.openxmlformats")) {
      // Check if it's an OOXML document by looking for Office markers in the ZIP
      const contentStr = buffer.toString("utf-8");
      const isOoxml = contentStr.includes("docProps/") || contentStr.includes("word/") || contentStr.includes("xl/") || contentStr.includes("ppt/");
      if (isOoxml) {
        const officeResult = analyzeOfficeDocument(buffer, detectedContentType);
        indicators.push(...officeResult.indicators.map((i) => ({ rule: i.rule, severity: i.severity, description: i.description, detail: i.detail })));
        if (officeResult.externalUrls.length > 0) allExtractedUrls.push(...officeResult.externalUrls);
        metadata.office = {
          hasMacros: officeResult.hasMacros,
          macroType: officeResult.macroType,
          hasExternalRelationships: officeResult.hasExternalRelationships,
          externalUrls: officeResult.externalUrls,
          hasOleObjects: officeResult.hasOleObjects,
          hasDdeLinks: officeResult.hasDdeLinks,
          documentTitle: officeResult.documentTitle,
          documentAuthor: officeResult.documentAuthor,
        };
      } else {
        const archiveResult = analyzeArchive(buffer);
        indicators.push(...archiveResult.indicators.map((i) => ({ rule: i.rule, severity: i.severity, description: i.description, detail: i.detail })));
        metadata.archive = {
          entries: archiveResult.entries,
          totalEntries: archiveResult.totalEntries,
          totalUncompressedSize: archiveResult.totalUncompressedSize,
          maxCompressionRatio: archiveResult.maxCompressionRatio,
          hasPathTraversal: archiveResult.hasPathTraversal,
          nestingDepth: archiveResult.nestingDepth,
        };
      }
    } else if (detectedContentType === "application/vnd.ms-office" || detectedContentType === "application/x-cfbf") {
      const officeResult = analyzeOfficeDocument(buffer, detectedContentType);
      indicators.push(...officeResult.indicators.map((i) => ({ rule: i.rule, severity: i.severity, description: i.description, detail: i.detail })));
      if (officeResult.externalUrls.length > 0) allExtractedUrls.push(...officeResult.externalUrls);
      metadata.office = {
        hasMacros: officeResult.hasMacros,
        macroType: officeResult.macroType,
        hasExternalRelationships: officeResult.hasExternalRelationships,
        externalUrls: officeResult.externalUrls,
        hasOleObjects: officeResult.hasOleObjects,
        hasDdeLinks: officeResult.hasDdeLinks,
        documentTitle: officeResult.documentTitle,
        documentAuthor: officeResult.documentAuthor,
      };
    } else if (detectedContentType.startsWith("image/")) {
      const imageResult = analyzeImage(buffer, detectedContentType);
      indicators.push(...imageResult.indicators.map((i) => ({ rule: i.rule, severity: i.severity, description: i.description, detail: i.detail })));
      metadata.image = {
        width: imageResult.width,
        height: imageResult.height,
        format: imageResult.format,
        hasScript: imageResult.hasScript,
        hasAppendedData: imageResult.hasAppendedData,
      };
    }
  } catch (err) {
    indicators.push({ rule: "ANALYSIS_EXCEPTION", severity: "INFO", description: `Static analysis encountered an error: ${err instanceof Error ? err.message : String(err)}` });
  }

  // 4. YARA pattern matching
  const yaraMatches = runYaraRules(buffer, filename);
  for (const ym of yaraMatches) {
    indicators.push({ rule: ym.rule, severity: ym.severity, description: ym.description, detail: ym.matchedStrings?.join(", ") });
  }

  // 5. VirusTotal & ClamAV scans in parallel
  const [vtResult, clamAvResult] = await Promise.all([
    checkFileHash(attachment.sha256).catch((err) => ({ checked: false, found: false, malicious: 0, suspicious: 0, undetected: 0, harmless: 0, error: err instanceof Error ? err.message : String(err), permalink: undefined })),
    scanWithClamAv(buffer).catch(() => ({ available: false, status: "unavailable" as const })),
  ]);

  if (vtResult.found && vtResult.malicious > 0) {
    indicators.push({ rule: "VIRUSTOTAL_DETECTION", severity: vtResult.malicious >= 5 ? "CRITICAL" : "HIGH", description: `VirusTotal: ${vtResult.malicious} engine(s) detected this file as malicious`, detail: vtResult.permalink });
  }
  if (clamAvResult.status === "infected") {
    indicators.push({ rule: "CLAMAV_DETECTION", severity: "CRITICAL", description: `ClamAV detected malware: ${clamAvResult.virus ?? "unknown"}` });
  }

  // 6. Verdict determination — strict priority order
  let verdict: PayloadVerdict;
  if ((vtResult.found && vtResult.malicious >= 5) || clamAvResult.status === "infected") {
    verdict = "MALICIOUS";
  } else if (indicators.some((i) => i.severity === "CRITICAL")) {
    verdict = "MALICIOUS";
  } else if ((vtResult.found && vtResult.malicious >= 1) || (vtResult.found && vtResult.suspicious >= 3)) {
    verdict = "SUSPICIOUS";
  } else if (indicators.some((i) => i.severity === "HIGH" || i.severity === "MEDIUM")) {
    verdict = "SUSPICIOUS";
  } else if (clamAvResult.status === "error" || (vtResult.checked && vtResult.error)) {
    // Do NOT treat scanner errors as clean
    verdict = "ANALYSIS_ERROR";
  } else {
    verdict = "NO_THREAT_FOUND";
  }

  // 7. Build the complete analysis result
  const analysisResult: AttachmentPayloadAnalysis = {
    filename,
    declaredContentType: attachment.contentType,
    detectedContentType,
    extension: ext,
    size: attachment.size,
    sha256: attachment.sha256,
    sha1: attachment.sha1,
    md5: attachment.md5,
    verdict,
    indicators,
    extractedUrls: allExtractedUrls,
    virusTotal: vtResult,
    clamAv: clamAvResult,
    yaraMatches,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    extensionMismatch,
    doubleExtension: doubleExt,
    analyzedAt: new Date().toISOString(),
  };

  // 8. Convert indicators into Finding[] for the evidence engine
  const findings: Finding[] = indicators
    .filter((ind) => ind.severity !== "INFO")
    .map((ind) => ({
      id: crypto.randomUUID(),
      type: `PAYLOAD_${ind.rule}`,
      severity: ind.severity === "CRITICAL" ? "CRITICAL" as const : ind.severity === "HIGH" ? "HIGH" as const : ind.severity === "MEDIUM" ? "MEDIUM" as const : ind.severity === "LOW" ? "LOW" as const : "INFO" as const,
      title: `Attachment: ${filename}`,
      description: ind.description,
      evidence: [{ field: "attachment", value: filename }, { field: "sha256", value: attachment.sha256 }],
      scoreContribution: severityToScore(ind.severity),
    }));

  return { analysis: analysisResult, findings, extractedUrls: allExtractedUrls };
}

export async function analyzePayloads(rawAttachments: RawAttachment[] | undefined): Promise<{ payloadAnalysis: AttachmentPayloadAnalysis[]; findings: Finding[]; extractedUrls: string[] }> {
  if (!rawAttachments || rawAttachments.length === 0) {
    return { payloadAnalysis: [], findings: [], extractedUrls: [] };
  }

  const results = await Promise.all(rawAttachments.map(analyzeOneAttachment));

  const payloadAnalysis: AttachmentPayloadAnalysis[] = [];
  const findings: Finding[] = [];
  const extractedUrls = new Set<string>();

  for (const result of results) {
    payloadAnalysis.push(result.analysis);
    findings.push(...result.findings);
    for (const url of result.extractedUrls) extractedUrls.add(url);
  }

  return { payloadAnalysis, findings, extractedUrls: [...extractedUrls] };
}
