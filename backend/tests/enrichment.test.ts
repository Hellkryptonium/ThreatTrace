import { describe, it, expect, vi, beforeEach } from "vitest";
import { enrichEmail, lookupIpRdap, checkIpReputation } from "../src/services/enrichment/enrichment.service.js";
import type { NormalizedEmail } from "../src/types/email.js";

const testEmail: NormalizedEmail = {
  messageId: "test-msg-1",
  sender: { email: "attacker@suspicious-domain.com" },
  recipients: [{ email: "target@company.com" }],
  cc: [],
  subject: "Urgent: Verify Account",
  headers: {},
  receivedHeaders: [],
  urls: ["https://safe-looking-link.com/login"],
  attachments: [],
  forwarded: false,
  source: "EML",
};

describe("Enrichment Service with RDAP and AbuseIPDB", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handles enrichment gracefully when services return no data or fail", async () => {
    const result = await enrichEmail(testEmail, "198.51.100.1", ["203.0.113.5"]);

    expect(result).toBeDefined();
    expect(result.domains).toBeDefined();
    expect(result.ips).toBeDefined();
    expect(result.urls).toBeDefined();
    expect(result.providers).toBeDefined();
    expect(result.providers?.virusTotal).toBeDefined();
    expect(result.providers?.urlScan).toBeDefined();
    expect(result.providers?.abuseIpDb).toBeDefined();
    expect(result.providers?.rdap).toBeDefined();
    expect(result.providers?.rdap?.configured).toBe(true);
  });

  it("extracts and structures IP RDAP and geolocation data correctly", async () => {
    const mockIp = "193.142.146.35";
    const mockRdapResponse = {
      name: "SERVINGA",
      handle: "NET-193-142-146-0-1",
      startAddress: "193.142.146.0",
      endAddress: "193.142.146.255",
      country: "DE",
      events: [
        { eventAction: "registration", eventDate: "2020-11-05T10:00:00Z" },
        { eventAction: "last changed", eventDate: "2022-01-15T12:00:00Z" },
      ],
      entities: [
        {
          roles: ["registrant"],
          vcardArray: [
            "vcard",
            [
              ["version", {}, "text", "4.0"],
              ["fn", {}, "text", "Servinga GmbH"],
            ],
          ],
        },
        {
          roles: ["abuse"],
          vcardArray: [
            "vcard",
            [
              ["version", {}, "text", "4.0"],
              ["email", {}, "text", "abuse@servinga.net"],
            ],
          ],
        },
      ],
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (typeof url === "string" && url.includes("rdap.org/ip")) {
        return new Response(JSON.stringify(mockRdapResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });

    try {
      const rdapData = await lookupIpRdap(mockIp);
      expect(rdapData).toBeDefined();
      expect(rdapData?.networkName).toBe("SERVINGA");
      expect(rdapData?.registrant).toBe("Servinga GmbH");
      expect(rdapData?.abuseContact).toBe("abuse@servinga.net");
      expect(rdapData?.country).toBe("DE");
      expect(rdapData?.startAddress).toBe("193.142.146.0");
      expect(rdapData?.endAddress).toBe("193.142.146.255");
      expect(rdapData?.registered).toBe("2020-11-05T10:00:00Z");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
