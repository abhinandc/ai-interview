import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const purpose = url.searchParams.get("purpose") || "candidate_sidekick"

    const { data, error } = await supabaseAdmin
      .from("model_registry")
      .select("id,model_key,provider,purpose,is_active,created_at")
      .eq("is_active", true)
      .eq("purpose", purpose)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({
      models:
        data?.map((row) => ({
          id: row.id,
          model_key: row.model_key,
          provider: row.provider,
          purpose: row.purpose
        })) || []
    })
  } catch (error: any) {
    console.error("Models list error:", error)
    return NextResponse.json({ error: error.message || "Failed to load models" }, { status: 500 })
  }
}

