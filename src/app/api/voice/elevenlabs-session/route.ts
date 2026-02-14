import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { session_id, difficulty } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    // Map difficulty level to agent IDs from environment
    const agentIds: Record<number, string | undefined> = {
      1: process.env.ELEVENLABS_AGENT_EASY,
      2: process.env.ELEVENLABS_AGENT_MODERATE,
      3: process.env.ELEVENLABS_AGENT_MEDIUM,
      4: process.env.ELEVENLABS_AGENT_HARD,
      5: process.env.ELEVENLABS_AGENT_EXPERT
    }

    const difficultyLevel = difficulty || 3
    const agentId = agentIds[difficultyLevel]

    if (!agentId) {
      console.warn(
        `No agent configured for difficulty ${difficultyLevel}, using medium as fallback`
      )
      // Fallback to medium difficulty if agent not configured
      const fallbackAgentId = agentIds[3]
      if (!fallbackAgentId) {
        return NextResponse.json(
          { error: 'No ElevenLabs agents configured. Please add agent IDs to .env.local' },
          { status: 500 }
        )
      }
    }

    // For public agents, we can directly use the WebSocket URL
    // For private agents, you'd need to call ElevenLabs API to get a signed URL
    const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`

    return NextResponse.json({
      ws_url: wsUrl,
      agent_id: agentId,
      session_id,
      difficulty: difficultyLevel
    })
  } catch (error: any) {
    console.error('ElevenLabs session creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
