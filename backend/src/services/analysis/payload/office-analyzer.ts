import { Buffer } from 'node:buffer';
import * as zlib from 'node:zlib';

export interface OfficeAnalysisResult {
  hasMacros: boolean;
  macroType?: string;
  hasExternalRelationships: boolean;
  externalUrls: string[];
  hasOleObjects: boolean;
  hasDdeLinks: boolean;
  documentTitle?: string;
  documentAuthor?: string;
  indicators: Array<{ rule: string; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'; description: string; detail?: string }>;
}

export function analyzeOfficeDocument(buffer: Buffer, detectedType: string): OfficeAnalysisResult {
  const result: OfficeAnalysisResult = {
    hasMacros: false,
    hasExternalRelationships: false,
    externalUrls: [],
    hasOleObjects: false,
    hasDdeLinks: false,
    indicators: [],
  };

  const strContent = buffer.toString('binary');
  const ddeRegex = /<[^>]*\bDDE\b[^>]*>|\bDDEAUTO\b|\bDDE\s*"/i;
  if (ddeRegex.test(strContent)) {
    result.hasDdeLinks = true;
    result.indicators.push({ rule: 'OFFICE_DDE', severity: 'HIGH', description: 'Possible DDE link found' });
  }

  if (buffer.length >= 4 && buffer.toString('hex', 0, 4).toUpperCase() === '504B0304') {
    // Basic ZIP scan for OOXML
    if (strContent.includes('vbaProject.bin')) {
      result.hasMacros = true;
      result.macroType = 'VBA';
      result.indicators.push({ rule: 'OFFICE_MACRO', severity: 'CRITICAL', description: 'VBA macro found in OOXML' });
    }
    if (strContent.includes('TargetMode="External"')) {
      result.hasExternalRelationships = true;
      result.indicators.push({ rule: 'OFFICE_EXT_REL', severity: 'MEDIUM', description: 'External relationship found' });
      const targetRegex = /Target="(http[^"]+)"/g;
      let m;
      while ((m = targetRegex.exec(strContent)) !== null) {
        result.externalUrls.push(m[1]);
      }
    }
    if (strContent.includes('embeddings/oleObject')) {
      result.hasOleObjects = true;
      result.indicators.push({ rule: 'OFFICE_OLE', severity: 'HIGH', description: 'Embedded OLE object found' });
    }
  } else if (buffer.length >= 8 && buffer.toString('hex', 0, 8).toUpperCase() === 'D0CF11E0A1B11AE1') {
    // Basic scan for OLE2
    if (strContent.includes('VBA') || strContent.includes('Macros') || strContent.includes('_VBA_PROJECT_CUR')) {
      result.hasMacros = true;
      result.macroType = 'VBA';
      result.indicators.push({ rule: 'OFFICE_MACRO', severity: 'CRITICAL', description: 'VBA macro found in OLE2' });
    }
  }

  return result;
}
