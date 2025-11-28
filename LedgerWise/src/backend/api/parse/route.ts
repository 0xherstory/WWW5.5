import { NextRequest, NextResponse } from 'next/server'

async function callQwenAPI(prompt: string) {
  const qwenApiKey = process.env.QWEN_API_KEY
  if (!qwenApiKey) return null

  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${qwenApiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      input: {
        messages: [{ role: 'user', content: prompt }]
      },
      parameters: {
        result_format: 'message'
      }
    }),
  })

  if (!response.ok) throw new Error('Qwen API request failed')
  
  const result = await response.json()
  return result.output?.choices?.[0]?.message?.content
}

async function callClaudeAPI(prompt: string) {
  const claudeApiKey = process.env.CLAUDE_API_KEY
  if (!claudeApiKey) return null

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    }),
  })

  if (!response.ok) throw new Error('Claude API request failed')
  
  const result = await response.json()
  return result.content?.[0]?.text
}

export async function POST(request: NextRequest) {
  try {
    const { text, prompt } = await request.json()
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Check if any AI service is configured
    const hasQwen = !!process.env.QWEN_API_KEY
    const hasClaude = !!process.env.CLAUDE_API_KEY
    
    if (!hasQwen && !hasClaude) {
      return NextResponse.json({ error: 'No AI service configured' }, { status: 500 })
    }

    let aiResponse = null
    
    // Try Qwen first, fallback to Claude
    try {
      if (hasQwen) {
        aiResponse = await callQwenAPI(prompt)
      }
    } catch (error) {
      console.log('Qwen API failed, trying Claude...', error)
    }

    if (!aiResponse && hasClaude) {
      try {
        aiResponse = await callClaudeAPI(prompt)
      } catch (error) {
        console.error('Claude API also failed:', error)
      }
    }

    if (!aiResponse) {
      throw new Error('All AI services failed')
    }

    // Parse JSON from AI response
    let parsedData
    try {
      // Extract JSON if wrapped in markdown code blocks
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiResponse.match(/```\s*([\s\S]*?)\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse
      parsedData = JSON.parse(jsonString.trim())
    } catch (error) {
      return NextResponse.json({ 
        error: 'AI返回格式错误，请重新输入',
        rawResponse: aiResponse 
      }, { status: 400 })
    }

    // Validate required fields
    if (!parsedData.amount || !parsedData.category || !parsedData.date) {
      return NextResponse.json({ 
        error: '解析结果不完整，请重新输入' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: parsedData
    })

  } catch (error) {
    console.error('Parse API error:', error)
    return NextResponse.json({ 
      error: '解析失败，请重试' 
    }, { status: 500 })
  }
}
