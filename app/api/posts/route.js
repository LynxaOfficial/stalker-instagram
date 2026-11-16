import { NextResponse } from "next/server";
import { getPosts } from "../../../lib/ig";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("u")?.replace(/^@/, "").trim();
  const count = Math.min(parseInt(searchParams.get("n") || "12", 10), 30);
  if (!username) {
    return NextResponse.json({ error: "Missing ?u=username" }, { status: 400 });
  }
  try {
    const data = await getPosts(username, count);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
  }
}
