import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const start = Date.now();
  const { error } = await supabase.from("prompts").select("id").limit(1);
  const latency = Date.now() - start;

  if (error) {
    return NextResponse.json(
      { status: "error", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: "ok",
    db_latency_ms: latency,
    timestamp: new Date().toISOString(),
  });
}
