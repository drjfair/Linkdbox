/**
 * One-time OAuth2 flow to generate a Google refresh token.
 *
 * Usage:
 *   1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
 *   2. Run: npx tsx scripts/auth.ts
 *   3. Open the URL printed to the console, approve access
 *   4. Copy the printed GOOGLE_REFRESH_TOKEN into your .env.local
 *
 * Required scope: gmail.modify (read, label, create drafts — no send)
 */

import * as http from "http";
import * as url from "url";
import { google } from "googleapis";

// Load .env.local manually since we're outside Next.js
import * as fs from "fs";
import * as path from "path";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3001/callback";
const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "❌  GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local"
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // Force consent screen so we always get a refresh_token
});

console.log("\n📧  Gmail OAuth2 Setup\n");
console.log("Open this URL in your browser to authorize access:\n");
console.log(authUrl);
console.log("\nWaiting for callback on http://localhost:3001 ...\n");

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/callback")) {
    res.end("Not found");
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const code = parsedUrl.query.code as string;

  if (!code) {
    res.writeHead(400);
    res.end("Missing authorization code");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<html><body><h2>✅ Authorization successful!</h2><p>You can close this tab and return to the terminal.</p></body></html>"
    );

    console.log("\n✅  Authorization successful!\n");

    if (tokens.refresh_token) {
      console.log("Add this to your .env.local and Vercel environment variables:\n");
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    } else {
      console.log(
        "⚠️  No refresh_token received. This can happen if the account already\n" +
          "    authorized this app. To fix: revoke access at https://myaccount.google.com/permissions\n" +
          "    then run this script again.\n"
      );
    }
  } catch (err) {
    res.writeHead(500);
    res.end("Error getting tokens");
    console.error("❌  Error getting tokens:", err);
  } finally {
    server.close();
  }
});

server.listen(3001);
