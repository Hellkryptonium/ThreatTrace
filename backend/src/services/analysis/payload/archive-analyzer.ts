import { Buffer } from 'node:buffer';

export interface ArchiveAnalysisResult {
  entries: Array<{ filename: string; compressedSize: number; uncompressedSize: number; isEncrypted: boolean; isExecutable: boolean; isArchive: boolean }>;
  totalEntries: number;
  totalUncompressedSize: number;
  maxCompressionRatio: number;
  hasPathTraversal: boolean;
  nestingDepth: number;
  indicators: Array<{ rule: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'; description: string; detail?: string }>;
}

export function analyzeArchive(buffer: Buffer): ArchiveAnalysisResult {
  const result: ArchiveAnalysisResult = {
    entries: [],
    totalEntries: 0,
    totalUncompressedSize: 0,
    maxCompressionRatio: 1,
    hasPathTraversal: false,
    nestingDepth: 0,
    indicators: [],
  };

  if (buffer.length < 22) return result;

  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) return result;

  const cdRecords = buffer.readUInt16LE(eocdOffset + 10);
  let cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  
  const dangerousExts = ['.exe', '.scr', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.hta', '.lnk'];
  const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.iso'];

  let currentOffset = cdOffset;
  for (let i = 0; i < cdRecords; i++) {
    if (currentOffset + 46 > buffer.length || buffer.readUInt32LE(currentOffset) !== 0x02014b50) break;
    
    const flags = buffer.readUInt16LE(currentOffset + 8);
    const compressedSize = buffer.readUInt32LE(currentOffset + 20);
    const uncompressedSize = buffer.readUInt32LE(currentOffset + 24);
    const filenameLen = buffer.readUInt16LE(currentOffset + 28);
    const extraLen = buffer.readUInt16LE(currentOffset + 30);
    const commentLen = buffer.readUInt16LE(currentOffset + 32);

    const filename = buffer.toString('utf8', currentOffset + 46, currentOffset + 46 + filenameLen);
    const isEncrypted = (flags & 1) === 1;
    
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    const isExecutable = dangerousExts.includes(ext);
    const isArchive = archiveExts.includes(ext);

    result.entries.push({
      filename,
      compressedSize,
      uncompressedSize,
      isEncrypted,
      isExecutable,
      isArchive,
    });

    result.totalEntries++;
    result.totalUncompressedSize += uncompressedSize;
    
    if (compressedSize > 0) {
      const ratio = uncompressedSize / compressedSize;
      if (ratio > result.maxCompressionRatio) result.maxCompressionRatio = ratio;
    }

    if (filename.includes('../') || filename.includes('..\\')) {
      result.hasPathTraversal = true;
    }
    if (isArchive) {
      result.nestingDepth = Math.max(result.nestingDepth, 1);
    }

    currentOffset += 46 + filenameLen + extraLen + commentLen;
  }

  if (result.hasPathTraversal) {
    result.indicators.push({ rule: 'ARCHIVE_PATH_TRAVERSAL', severity: 'CRITICAL', description: 'Archive contains path traversal' });
  }
  if (result.totalUncompressedSize > 100 * 1024 * 1024 || result.maxCompressionRatio > 100) {
    result.indicators.push({ rule: 'ARCHIVE_ZIP_BOMB', severity: 'HIGH', description: 'Possible zip bomb detected' });
  }
  if (result.entries.some(e => e.isEncrypted)) {
    result.indicators.push({ rule: 'ARCHIVE_ENCRYPTED', severity: 'MEDIUM', description: 'Archive contains encrypted entries' });
  }
  if (result.entries.some(e => e.isExecutable)) {
    result.indicators.push({ rule: 'ARCHIVE_EXECUTABLE', severity: 'HIGH', description: 'Archive contains dangerous executable' });
  }

  return result;
}
