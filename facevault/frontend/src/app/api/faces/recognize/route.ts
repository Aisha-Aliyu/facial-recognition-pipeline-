import { NextRequest, NextResponse } from "next/server";
import { ratelimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";

  const { success, limit, remaining, reset } = await ratelimit.limit(`recognize_${ip}`);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Max 100 per hour per IP." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const body = await req.formData();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const upstream = await fetch(`${backendUrl}/api/faces/recognize`, {
      method: "POST",
      body,
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  } catch (err) {
    console.error("[recognize route error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
