import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("experience_quotes")
      .select("id,quote,author,is_active,weight")
      .eq("is_active", true)
      .order("weight", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30)

    if (error) throw error

    return NextResponse.json({
      quotes:
        data?.map((row) => ({
          id: row.id,
          quote: row.quote,
          author: row.author || "OneOrigin"
        })) || []
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        quotes: [],
        error: error?.message || "Unable to load experience quotes"
      },
      { status: 500 }
    )
  }
}
