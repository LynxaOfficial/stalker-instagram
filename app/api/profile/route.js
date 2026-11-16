import { NextResponse } from "next/server";
import { getProfile } from "../../../lib/ig";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("u")?.replace(/^@/, "").trim();
  if (!username) {
    return NextResponse.json({ error: "Missing ?u=username" }, { status: 400 });
  }
  try {
    const data = await getProfile(username);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
  }
}
