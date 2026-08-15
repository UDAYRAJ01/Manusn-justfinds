import { describe, expect, it } from "vitest";
import { heartbeatSessionFromHeaders } from "./heartbeatSession";

describe("heartbeatSessionFromHeaders", () => {
  it("uses the session cookie when it is available", () => {
    expect(heartbeatSessionFromHeaders("theme=dark; app_session_id=cookie-session", "Bearer bearer-session", "app_session_id")).toBe("cookie-session");
  });

  it("falls back to the administrator bearer session used by preview authentication", () => {
    expect(heartbeatSessionFromHeaders(undefined, "Bearer bearer-session", "app_session_id")).toBe("bearer-session");
  });

  it("returns an empty value only when neither supported credential is supplied", () => {
    expect(heartbeatSessionFromHeaders(undefined, undefined, "app_session_id")).toBe("");
  });
});
