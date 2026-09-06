import { Buffer } from 'node:buffer';

export interface FileSignatureResult {
  detectedType: string;
  detectedExtension: string;
  confidence: 'high' | 'medium' | 'low';
}

export function detectFileType(buffer: Buffer): FileSignatureResult {
  if (buffer.length >= 5 && buffer.toString('hex', 0, 5).toUpperCase() === '255044462D') {
    return { detectedType: 'application/pdf', detectedExtension: '.pdf', confidence: 'high' };
  }
  if (buffer.length >= 4 && buffer.toString('hex', 0, 4).toUpperCase() === '504B0304') {
    return { detectedType: 'application/zip', detectedExtension: '.zip', confidence: 'high' };
  }
  if (buffer.length >= 8 && buffer.toString('hex', 0, 8).toUpperCase() === 'D0CF11E0A1B11AE1') {
    return { detectedType: 'application/vnd.ms-office', detectedExtension: '.doc', confidence: 'high' };
  }
  if (buffer.length >= 2 && buffer.toString('hex', 0, 2).toUpperCase() === '4D5A') {
    return { detectedType: 'application/x-msdownload', detectedExtension: '.exe', confidence: 'high' };
  }
  if (buffer.length >= 4 && buffer.toString('hex', 0, 4).toUpperCase() === '7F454C46') {
    return { detectedType: 'application/x-elf', detectedExtension: '.elf', confidence: 'high' };
  }
  if (buffer.length >= 4) {
    const magic = buffer.toString('hex', 0, 4).toUpperCase();
    if (['FEEDFACE', 'FEEDFACF', 'CEFAEDFE', 'CFFAEDFE'].includes(magic)) {
      return { detectedType: 'application/x-mach-binary', detectedExtension: '.macho', confidence: 'high' };
    }
  }
  if (buffer.length >= 6 && buffer.toString('hex', 0, 6).toUpperCase() === '526172211A07') {
    return { detectedType: 'application/x-rar-compressed', detectedExtension: '.rar', confidence: 'high' };
  }
  if (buffer.length >= 6 && buffer.toString('hex', 0, 6).toUpperCase() === '377ABCAF271C') {
    return { detectedType: 'application/x-7z-compressed', detectedExtension: '.7z', confidence: 'high' };
  }
  if (buffer.length >= 2 && buffer.toString('hex', 0, 2).toUpperCase() === '1F8B') {
    return { detectedType: 'application/gzip', detectedExtension: '.gz', confidence: 'high' };
  }
  if (buffer.length >= 8 && buffer.toString('hex', 0, 8).toUpperCase() === '89504E470D0A1A0A') {
    return { detectedType: 'image/png', detectedExtension: '.png', confidence: 'high' };
  }
  if (buffer.length >= 3 && buffer.toString('hex', 0, 3).toUpperCase() === 'FFD8FF') {
    return { detectedType: 'image/jpeg', detectedExtension: '.jpg', confidence: 'high' };
  }
  if (buffer.length >= 4 && buffer.toString('hex', 0, 4).toUpperCase() === '47494638') {
    return { detectedType: 'image/gif', detectedExtension: '.gif', confidence: 'high' };
  }
  if (buffer.length >= 2 && buffer.toString('hex', 0, 2).toUpperCase() === '424D') {
    return { detectedType: 'image/bmp', detectedExtension: '.bmp', confidence: 'high' };
  }
  if (buffer.length >= 12 && buffer.toString('utf8', 0, 4) === 'RIFF' && buffer.toString('utf8', 8, 12) === 'WEBP') {
    return { detectedType: 'image/webp', detectedExtension: '.webp', confidence: 'high' };
  }

  const str = buffer.toString('utf8', 0, Math.min(buffer.length, 1024)).trim();
  if (str.startsWith('<?xml') || str.startsWith('<svg')) {
    return { detectedType: 'image/svg+xml', detectedExtension: '.svg', confidence: 'medium' };
  }

  return { detectedType: 'application/octet-stream', detectedExtension: '.bin', confidence: 'low' };
}

export function checkExtensionMismatch(declaredFilename: string, detectedType: string): { mismatch: boolean; declaredExt: string; expectedExt: string } {
  const parts = declaredFilename.split('.');
  const declaredExt = parts.length > 1 ? '.' + parts[parts.length - 1].toLowerCase() : '';
  const typeMap: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/x-msdownload': '.exe',
    'application/vnd.ms-office': '.doc',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };
  const expectedExt = typeMap[detectedType] || '';
  let mismatch = false;
  if (expectedExt && expectedExt !== declaredExt) {
    if (detectedType === 'application/zip' && ['.zip', '.docx', '.xlsx', '.pptx', '.jar', '.apk'].includes(declaredExt)) {
      mismatch = false;
    } else if (detectedType === 'application/vnd.ms-office' && ['.doc', '.xls', '.ppt'].includes(declaredExt)) {
      mismatch = false;
    } else if (detectedType === 'image/jpeg' && ['.jpg', '.jpeg'].includes(declaredExt)) {
      mismatch = false;
    } else {
      mismatch = true;
    }
  }
  return { mismatch, declaredExt, expectedExt };
}

export function hasDoubleExtension(filename: string): boolean {
  const parts = filename.split('.');
  if (parts.length < 3) return false;
  const ext = parts[parts.length - 1].toLowerCase();
  const dangerousExecutables = ['.exe', '.scr', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.hta', '.lnk', '.iso', '.msi', '.dll', '.com', '.pif'];
  return dangerousExecutables.includes('.' + ext);
}

export function hasRtloCharacter(filename: string): boolean {
  return filename.includes('\u202E');
}
