import { Buffer } from 'node:buffer';

export interface ImageAnalysisResult {
  width?: number;
  height?: number;
  format?: string;
  hasScript?: boolean;
  hasAppendedData?: boolean;
  indicators: Array<{ rule: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'; description: string; detail?: string }>;
}

export function analyzeImage(buffer: Buffer, detectedType: string): ImageAnalysisResult {
  const result: ImageAnalysisResult = {
    indicators: [],
    hasAppendedData: false,
    hasScript: false,
  };

  if (detectedType === 'image/png' && buffer.length >= 24) {
    result.format = 'png';
    result.width = buffer.readUInt32BE(16);
    result.height = buffer.readUInt32BE(20);
    const iendIndex = buffer.indexOf('IEND');
    if (iendIndex !== -1 && iendIndex + 8 < buffer.length) {
      result.hasAppendedData = true;
      result.indicators.push({ rule: 'IMAGE_APPENDED_DATA', severity: 'MEDIUM', description: 'Data appended after PNG IEND chunk' });
    }
  } else if (detectedType === 'image/jpeg') {
    result.format = 'jpeg';
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xFF) break;
      const marker = buffer[offset + 1];
      if (marker === 0xC0 || marker === 0xC2) {
        result.height = buffer.readUInt16BE(offset + 5);
        result.width = buffer.readUInt16BE(offset + 7);
        break;
      }
      const length = buffer.readUInt16BE(offset + 2);
      offset += length + 2;
    }
    const eoiIndex = buffer.indexOf(Buffer.from([0xFF, 0xD9]));
    if (eoiIndex !== -1 && eoiIndex + 2 < buffer.length) {
      result.hasAppendedData = true;
      result.indicators.push({ rule: 'IMAGE_APPENDED_DATA', severity: 'MEDIUM', description: 'Data appended after JPEG EOI marker' });
    }
  } else if (detectedType === 'image/gif' && buffer.length >= 10) {
    result.format = 'gif';
    result.width = buffer.readUInt16LE(6);
    result.height = buffer.readUInt16LE(8);
  } else if (detectedType === 'image/bmp' && buffer.length >= 26) {
    result.format = 'bmp';
    result.width = buffer.readUInt32LE(18);
    result.height = buffer.readUInt32LE(22);
  } else if (detectedType === 'image/svg+xml') {
    result.format = 'svg';
    const content = buffer.toString('utf8').toLowerCase();
    if (content.includes('<script') || content.includes('javascript:') || content.includes('onload=') || content.includes('onerror=') || content.includes('onclick=') || content.includes('<foreignobject')) {
      result.hasScript = true;
      result.indicators.push({ rule: 'IMAGE_SCRIPT', severity: 'HIGH', description: 'SVG contains script or dangerous attributes' });
    }
  }

  return result;
}
