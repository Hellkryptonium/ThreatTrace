import type { YaraMatch } from "../../../types/email.js";

export function runYaraRules(buffer: Buffer, filename: string): YaraMatch[] {
    const matches: YaraMatch[] = [];
    const content = buffer.toString('utf-8');
    const lowerContent = content.toLowerCase();

    // 1. SUSPICIOUS_POWERSHELL (HIGH)
    const psPatterns = ['-encodedcommand', 'downloadstring', 'iex', '-executionpolicy bypass', 'invoke-expression', 'new-object system.net.webclient', '[convert]::frombase64string'];
    const psMatches = psPatterns.filter(p => lowerContent.includes(p));
    if (psMatches.length > 0) {
        matches.push({
            rule: 'SUSPICIOUS_POWERSHELL',
            description: 'Suspicious PowerShell commands detected',
            severity: 'HIGH',
            matchedStrings: psMatches
        });
    }

    // 2. VBA_MACRO_AUTOEXEC (HIGH)
    const vbaPatterns = ['autoopen', 'document_open', 'workbook_open', 'auto_open', 'shell(', 'wscript.shell', 'createobject'];
    const vbaMatches = vbaPatterns.filter(p => lowerContent.includes(p));
    if (vbaMatches.length > 0) {
        matches.push({
            rule: 'VBA_MACRO_AUTOEXEC',
            description: 'Auto-executing VBA macros detected',
            severity: 'HIGH',
            matchedStrings: vbaMatches
        });
    }

    // 3. OFFICE_DDE_EXEC (HIGH)
    const ddePatterns = ['ddeauto', 'dde "'];
    const ddeMatches = ddePatterns.filter(p => lowerContent.includes(p));
    if (ddeMatches.length > 0) {
        matches.push({
            rule: 'OFFICE_DDE_EXEC',
            description: 'Office DDE execution patterns detected',
            severity: 'HIGH',
            matchedStrings: ddeMatches
        });
    }

    // 4. SUSPICIOUS_SCRIPT_OBFUSCATION (MEDIUM)
    const obsPatterns = ['chrw(', 'chr$(', 'fromcharcode', 'string.fromcharcode', 'eval(', 'wscript.createobject'];
    // For XOR loop patterns, a basic string match might not suffice, but we'll include typical identifiers
    const obsMatches = obsPatterns.filter(p => lowerContent.includes(p));
    if (obsMatches.length > 0) {
        matches.push({
            rule: 'SUSPICIOUS_SCRIPT_OBFUSCATION',
            description: 'Script obfuscation patterns detected',
            severity: 'MEDIUM',
            matchedStrings: obsMatches
        });
    }

    // 5. SUSPICIOUS_PDF_LAUNCH (CRITICAL)
    const hasLaunch = lowerContent.includes('/launch');
    const hasAction = lowerContent.includes('/action');
    if (hasLaunch && hasAction) {
        matches.push({
            rule: 'SUSPICIOUS_PDF_LAUNCH',
            description: 'PDF /Launch and /Action detected, potentially indicating malware execution',
            severity: 'CRITICAL',
            matchedStrings: ['/launch', '/action']
        });
    }

    // 6. EXECUTABLE_IN_DOCUMENT (CRITICAL)
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const peExtensions = ['exe', 'dll', 'sys', 'scr', 'pif', 'com'];
    if (!peExtensions.includes(ext) && buffer.length >= 2) {
        let mzFound = false;
        // Check if file itself starts with MZ (extension disguise)
        if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
            mzFound = true;
        } else if (lowerContent.includes("this program cannot be run in dos mode")) {
            mzFound = true;
        } else {
            // Search for embedded PE header with valid e_lfanew
            for (let i = 0; i < buffer.length - 64; i++) {
                if (buffer[i] === 0x4D && buffer[i + 1] === 0x5A) {
                    const peOffset = buffer.readUInt32LE(i + 0x3C);
                    if (peOffset > 0 && peOffset < 1024 && i + peOffset + 4 <= buffer.length) {
                        if (buffer[i + peOffset] === 0x50 && buffer[i + peOffset + 1] === 0x45 && buffer[i + peOffset + 2] === 0 && buffer[i + peOffset + 3] === 0) {
                            mzFound = true;
                            break;
                        }
                    }
                }
            }
        }
        if (mzFound) {
            matches.push({
                rule: 'EXECUTABLE_IN_DOCUMENT',
                description: 'MZ executable header found embedded in a non-executable document',
                severity: 'CRITICAL',
                matchedStrings: ['MZ']
            });
        }
    }

    return matches;
}
