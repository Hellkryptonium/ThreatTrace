import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { AnalysisModel } from "../src/models/Analysis.js";

const app = createApp();

describe("ThreatTrace API", () => {
  it("reports health", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("rejects unauthenticated uploads", async () => {
    const response = await request(app)
      .post("/api/v1/emails/upload")
      .attach("file", Buffer.from("not an email"), "payload.exe");
    expect(response.status).toBe(401);
    expect(response.body.error).toContain("Authentication required");
  });

  it("protects Gmail access", async () => {
    const response = await request(app).get("/api/v1/gmail/status");
    expect(response.status).toBe(401);
  });

  it("protects Outlook access", async () => {
    const response = await request(app).get("/api/v1/outlook/status");
    expect(response.status).toBe(401);
  });

  it("protects Copilot chat", async () => {
    const response = await request(app).post("/api/v1/copilot/chat").send({ message: "Explain this verdict" });
    expect(response.status).toBe(401);
  });

  it("persists URL and route intelligence in the analysis schema", () => {
    expect(AnalysisModel.schema.path("urlIntelligence")).toBeDefined();
    expect(AnalysisModel.schema.path("relayPath")).toBeDefined();
    expect(AnalysisModel.schema.path("assessmentNote")).toBeDefined();
    expect(AnalysisModel.schema.path("probableOriginIp")).toBeDefined();
  });
});
