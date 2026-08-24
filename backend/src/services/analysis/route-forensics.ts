import type { NormalizedEmail, RelayHop } from "../../types/email.js";

const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

function isPublicIpv4(value: string): boolean {
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => part < 0 || part > 255)) return false;
  const [first, second] = parts;
  return first !== 10 && first !== 127 && !(first === 192 && second === 168) && !(first === 172 && second >= 16 && second <= 31) && !(first === 169 && second === 254) && !(first === 0) && !(first >= 224);
}

function isValidIpv4(value: string): boolean {
  return value.split(".").length === 4 && value.split(".").every((part) => /^\d+$/.test(part) && (part === "0" || !part.startsWith("0")) && Number(part) <= 255);
}

export function analyzeRoute(email: NormalizedEmail): { relayPath: RelayHop[]; probableOriginIp?: string } {
  const relayPath = (email.receivedHeaders ?? []).map((value, index) => ({
    hop: index + 1,
    value,
    ipAddresses: [...new Set((value.match(ipPattern) ?? []).filter(isValidIpv4))],
  }));
  const probableOriginIp = [...relayPath].reverse().flatMap((hop) => hop.ipAddresses).find(isPublicIpv4);
  return { relayPath, probableOriginIp };
}