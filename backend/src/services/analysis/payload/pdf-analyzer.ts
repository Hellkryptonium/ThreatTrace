import { Buffer } from 'node:buffer';

export interface PdfAnalysisResult {
  title?: string;
  author?: string;
  producer?: string;
  creationDate?: string;
  hasJavaScript: boolean;
  hasLaunchAction: boolean;
  hasAutoAction: boolean;
  hasEmbeddedFiles: boolean;
  formCount: number;
  suspiciousFilters: string[];
  extractedUrls: string[];
  indicators: Array<{ rule: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'; description: string; detail?: string }>;
}

export function analyzePdf(buffer: Buffer): PdfAnalysisResult {
  const content = buffer.toString('binary');
  const result: PdfAnalysisResult = {
    hasJavaScript: false,
    hasLaunchAction: false,
    hasAutoAction: false,
    hasEmbeddedFiles: false,
    formCount: 0,
    suspiciousFilters: [],
    extractedUrls: [],
    indicators: [],
  };

  if (content.includes('/JavaScript') || content.includes('/JS')) {
    result.hasJavaScript = true;
    result.indicators.push({ rule: 'PDF_JS', severity: 'HIGH', description: 'PDF contains JavaScript' });
  }

  if (content.includes('/Launch')) {
    result.hasLaunchAction = true;
    result.indicators.push({ rule: 'PDF_LAUNCH', severity: 'CRITICAL', description: 'PDF contains Launch action' });
  }

  if (content.includes('/OpenAction') || content.includes('/AA')) {
    result.hasAutoAction = true;
    result.indicators.push({ rule: 'PDF_AUTO_ACTION', severity: 'MEDIUM', description: 'PDF contains auto-executing action' });
  }

  if (content.includes('/EmbeddedFiles') || content.includes('/EF') || content.includes('/Filespec')) {
    result.hasEmbeddedFiles = true;
    result.indicators.push({ rule: 'PDF_EMBEDDED_FILES', severity: 'MEDIUM', description: 'PDF contains embedded files' });
  }

  const formMatches = content.match(/\/AcroForm/g);
  if (formMatches) {
    result.formCount = formMatches.length;
  }

  if (content.includes('/ASCIIHexDecode')) result.suspiciousFilters.push('ASCIIHexDecode');
  if (content.includes('/LZWDecode')) result.suspiciousFilters.push('LZWDecode');

  const uriRegex = /\/URI\s*\((http[^)]+)\)/g;
  let match;
  while ((match = uriRegex.exec(content)) !== null) {
    result.extractedUrls.push(match[1]);
  }

  const titleMatch = content.match(/\/Title\s*\(([^)]+)\)/);
  if (titleMatch) result.title = titleMatch[1];
  const authorMatch = content.match(/\/Author\s*\(([^)]+)\)/);
  if (authorMatch) result.author = authorMatch[1];
  const producerMatch = content.match(/\/Producer\s*\(([^)]+)\)/);
  if (producerMatch) result.producer = producerMatch[1];
  const creationDateMatch = content.match(/\/CreationDate\s*\(([^)]+)\)/);
  if (creationDateMatch) result.creationDate = creationDateMatch[1];

  return result;
}
