import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    gmailState?: string;
    outlookState?: string;
    microsoftAuthState?: string;
  }
}