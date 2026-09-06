import type { VirusTotalFileResult } from "../../../types/email.js";
import { env } from "../../../config/env.js";

export async function checkFileHash(sha256: string): Promise<VirusTotalFileResult> {
    if (!env.VIRUSTOTAL_API_KEY) {
        return {
            checked: false,
            found: false,
            malicious: 0,
            suspicious: 0,
            undetected: 0,
            harmless: 0,
            error: "VirusTotal API key not configured"
        };
    }

    try {
        const response = await fetch(`https://www.virustotal.com/api/v3/files/${sha256}`, {
            headers: {
                'x-apikey': env.VIRUSTOTAL_API_KEY
            },
            signal: AbortSignal.timeout(10000)
        });

        if (response.status === 404) {
            return { checked: true, found: false, malicious: 0, suspicious: 0, undetected: 0, harmless: 0 };
        }

        if (!response.ok) {
            return {
                checked: false,
                found: false,
                malicious: 0,
                suspicious: 0,
                undetected: 0,
                harmless: 0,
                error: `VirusTotal API Error: ${response.status} ${response.statusText}`
            };
        }

        const data = await response.json();
        const stats = data?.data?.attributes?.last_analysis_stats || { malicious: 0, suspicious: 0, undetected: 0, harmless: 0 };

        return {
            checked: true,
            found: true,
            malicious: stats.malicious || 0,
            suspicious: stats.suspicious || 0,
            undetected: stats.undetected || 0,
            harmless: stats.harmless || 0,
            permalink: `https://www.virustotal.com/gui/file/${sha256}`
        };
    } catch (error: any) {
        return {
            checked: false,
            found: false,
            malicious: 0,
            suspicious: 0,
            undetected: 0,
            harmless: 0,
            error: error.message || "Unknown error communicating with VirusTotal API"
        };
    }
}
