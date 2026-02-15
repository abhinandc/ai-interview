import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("experience_announcements")
      .select("id,title,detail,cta_label,cta_href,is_active,priority")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ announcements: data || [] })
  } catch (error: any) {
    return NextResponse.json(
      {
        announcements: [],
        error: error?.message || "Unable to load announcements"
      },
      { status: 500 }
    )
  }
}
