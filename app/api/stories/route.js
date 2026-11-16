import { NextResponse } from "next/server";

// Stories require an authenticated session — public endpoints don't serve them.
// Wire this to a provider (SocialCrawl / Apify / SearchAPI) via env key.
export async function GET(req) {
  return NextResponse.json({
    ok: false,
    error:
      "Stories need an API key. Set STALKER_API_KEY and connect a provider (SocialCrawl, Apify, or SearchAPI).",
  });
}
