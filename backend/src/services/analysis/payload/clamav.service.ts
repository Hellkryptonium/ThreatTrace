import type { ClamAvResult } from "../../../types/email.js";
import { env } from "../../../config/env.js";
import net from "node:net";

export async function scanWithClamAv(buffer: Buffer): Promise<ClamAvResult> {
    if (!env.CLAMAV_HOST) {
        return { available: false, status: "unavailable" };
    }

    return new Promise((resolve) => {
        const port = env.CLAMAV_PORT ?? 3310;
        const host = env.CLAMAV_HOST as string;
        
        const socket = net.createConnection({ host, port });
        socket.setTimeout(30000); // 30 seconds

        let responseData = "";

        socket.on("connect", () => {
            // Initiate zINSTREAM protocol
            socket.write("zINSTREAM\0");

            const chunkSize = 16384;
            for (let i = 0; i < buffer.length; i += chunkSize) {
                const chunk = buffer.subarray(i, i + chunkSize);
                const lengthBuffer = Buffer.alloc(4);
                lengthBuffer.writeUInt32BE(chunk.length, 0);
                socket.write(lengthBuffer);
                socket.write(chunk);
            }

            // End of stream marker
            const zeroBuffer = Buffer.alloc(4);
            zeroBuffer.writeUInt32BE(0, 0);
            socket.write(zeroBuffer);
        });

        socket.on("data", (data) => {
            responseData += data.toString("utf-8");
        });

        socket.on("end", () => {
            const res = responseData.trim();
            if (res.includes("OK") && !res.includes("FOUND")) {
                resolve({ available: true, status: "clean" });
            } else if (res.includes("FOUND")) {
                const match = res.match(/stream: (.*?)\s+FOUND/);
                const extractedVirusName = match ? match[1] : "Unknown_Signature";
                resolve({ available: true, status: "infected", virus: extractedVirusName });
            } else {
                resolve({ available: true, status: "error", error: res || "Unknown response format from ClamAV" });
            }
        });

        socket.on("error", (err) => {
            resolve({ available: false, status: "unavailable", error: err.message });
        });

        socket.on("timeout", () => {
            socket.destroy();
            resolve({ available: true, status: "error", error: "ClamAV scan connection timed out" });
        });
    });
}
