import { NextResponse } from "next/server";
import { searchUsers } from "../../../lib/ig";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing ?q=query" }, { status: 400 });
  }
  try {
    const data = await searchUsers(q);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
  }
}
