import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("interview_sessions")
      .select("id,candidate_id")
      .eq("id", sessionId)
      .single()

    if (sessionError) throw sessionError
    if (!session?.candidate_id) {
      return NextResponse.json({ error: "Session has no candidate attached." }, { status: 404 })
    }

    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from("candidates")
      .select("id,resume_storage_path")
      .eq("id", session.candidate_id)
      .single()

    if (candidateError) throw candidateError

    let storagePath: string | null = (candidate as any)?.resume_storage_path || null
    let filename: string | null = null
    let mimeType: string | null = null

    if (!storagePath) {
      const { data: resumeRow, error: resumeError } = await supabaseAdmin
        .from("resumes")
        .select("storage_path,filename,mime_type,created_at")
        .eq("candidate_id", session.candidate_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (resumeError) throw resumeError
      storagePath = resumeRow?.storage_path || null
      filename = resumeRow?.filename || null
      mimeType = resumeRow?.mime_type || null
    }

    if (!storagePath) {
      return NextResponse.json({ signed_url: null, storage_path: null, filename: null }, { status: 200 })
    }

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from("resumes")
      .createSignedUrl(storagePath, 60 * 30)

    if (signedError) throw signedError

    return NextResponse.json({
      signed_url: signed?.signedUrl || null,
      storage_path: storagePath,
      filename,
      mime_type: mimeType,
      expires_in_seconds: 60 * 30
    })
  } catch (error: any) {
    console.error("Resume signed URL error:", error)
    return NextResponse.json({ error: error.message || "Failed to load resume." }, { status: 500 })
  }
}

