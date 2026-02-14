import { supabaseAdmin } from '@/lib/supabase/server'
import { generateFollowups, scoreArtifact, STANDARD_DIMENSIONS } from '@/lib/ai/score-smith'

export async function runScoringForArtifact(artifactId: string) {
  // Get artifact
  const { data: artifact, error } = await supabaseAdmin
    .from('artifacts')
    .select('*')
    .eq('id', artifactId)
    .single()

  if (error) throw error

  // Get scope package to find round information
  const { data: scopePackage } = await supabaseAdmin
    .from('interview_scope_packages')
    .select('*')
    .eq('session_id', artifact.session_id)
    .single()

  if (!scopePackage) {
    throw new Error('Scope package not found')
  }

  // Support both metadata-based and direct column-based artifacts
  let rawContent = artifact.metadata?.content || artifact.content || ''
  const roundNumber = artifact.metadata?.round_number || artifact.round_number

  if (!rawContent || !roundNumber) {
    console.error('Artifact data:', {
      has_metadata: !!artifact.metadata,
      has_content: !!artifact.content,
      has_round_number: !!artifact.round_number,
      artifact
    })
    throw new Error('Artifact content or round number missing')
  }

  // Convert transcript JSONB to string format
  let contentString: string
  if (typeof rawContent === 'string') {
    contentString = rawContent
  } else if (rawContent.items && Array.isArray(rawContent.items)) {
    // Voice transcript format: { items: [{ role, text, timestamp }] }
    contentString = rawContent.items
      .map((item: any) => {
        const speaker = item.role === 'user' ? 'Candidate' : 'Prospect'
        return `${speaker}: ${item.text}`
      })
      .join('\n\n')
  } else {
    // Fallback: JSON stringify
    contentString = JSON.stringify(rawContent)
  }

  const round = scopePackage.round_plan.find((r: any) => r.round_number === roundNumber)

  if (!round) {
    throw new Error('Round not found in scope package')
  }

  const results = await scoreArtifact(
    artifact.session_id,
    roundNumber,
    artifact.id,
    contentString,
    STANDARD_DIMENSIONS
  )

  const dimensionScores: Record<string, number> = {}
  const evidenceQuotes: Array<{ dimension: string; quote: string; line?: number }> = []
  let scoreSum = 0
  let maxSum = 0
  let confidenceSum = 0

  for (const result of results) {
    const dimension = result.dimension
    const score = Number(result.score) || 0
    const max = STANDARD_DIMENSIONS.find((d) => d.name === dimension)?.maxScore || 0

    dimensionScores[dimension] = score
    scoreSum += score
    maxSum += max
    confidenceSum += Number(result.confidence) || 0

    for (const evidence of result.evidence || []) {
      evidenceQuotes.push({
        dimension,
        quote: evidence.evidence,
        line: undefined
      })
    }
  }

  const overallScore = maxSum > 0 ? Math.round((scoreSum / maxSum) * 100) : 0
  const confidence = results.length > 0 ? Number((confidenceSum / results.length).toFixed(2)) : 0

  const criticalWeak = Object.entries(dimensionScores).some(([key, value]) => {
    if (key === 'role_depth' && value < 15) return true
    if (key === 'reasoning' && value < 10) return true
    if (key === 'verification' && value < 10) return true
    if (key === 'communication' && value < 8) return true
    if (key === 'reliability' && value < 8) return true
    return false
  })

  let redFlags: any[] = []

  const wordCount = String(contentString).trim().split(/\s+/).filter(Boolean).length
  if (wordCount < 5) {
    await supabaseAdmin.from('red_flags').insert({
      session_id: artifact.session_id,
      round_id: roundNumber,
      flag_type: 'insufficient_response',
      severity: 'high',
      description: 'Response too short to evaluate reliably',
      evidence: [{ quote: String(contentString).slice(0, 120), timestamp: 'n/a' }]
    })
  }

  if (evidenceQuotes.length === 0) {
    await supabaseAdmin.from('red_flags').insert({
      session_id: artifact.session_id,
      round_id: roundNumber,
      flag_type: 'no_evidence',
      severity: 'high',
      description: 'No evidence quotes available for scoring',
      evidence: []
    })
  }

  const { data: freshFlags } = await supabaseAdmin
    .from('red_flags')
    .select('*')
    .eq('session_id', artifact.session_id)
    .eq('round_id', roundNumber)
    .order('created_at', { ascending: false })

  redFlags = freshFlags || []

  const hasMajorRedFlag = (redFlags || []).some((flag: any) => {
    if (flag.severity === 'critical') return true
    const type = String(flag.flag_type || '')
    return [
      'unsafe_data_handling',
      'overconfident_without_verification',
      'overpromising',
      'no_testing_mindset',
      'conflict_escalation'
    ].includes(type)
  })

  const recommendation =
    overallScore >= 75 && !hasMajorRedFlag
      ? 'proceed'
      : overallScore >= 65 && overallScore <= 74 && !hasMajorRedFlag && !criticalWeak
        ? 'caution'
        : 'stop'

  const followups = await generateFollowups(
    contentString,
    dimensionScores,
    evidenceQuotes.map((item) => ({ dimension: item.dimension, quote: item.quote }))
  )

  await supabaseAdmin.from('scores').insert({
    session_id: artifact.session_id,
    round_number: round.round_number,
    overall_score: overallScore,
    dimension_scores: dimensionScores,
    recommendation
  })

  await supabaseAdmin.from('live_events').insert({
    session_id: artifact.session_id,
    event_type: 'scoring_completed',
    payload: {
      artifact_id: artifact.id,
      round_number: round.round_number,
      dimensions: results.length
    }
  })

  return { results, overall_score: overallScore }
}
