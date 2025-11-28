import { NextRequest, NextResponse } from 'next/server'

interface AssistantRequest {
  user_query: string;
  financial_data: {
    income: number;
    total_expense: number;
    savings: number;
    debt_payment: number;
    score_savings: number;
    score_debt: number;
    score_cashflow: number;
    score_spending_pressure: number;
    score_total: number;
    grade: string;
  };
}

function buildPrompt(data: AssistantRequest): string {
  return `You are a professional personal financial health coach. You do NOT calculate any financial scores - scores are already calculated by the system. Your task is to provide friendly, actionable financial advice based on user questions, their financial data, and scores.

Follow these rules:
- DO NOT provide investment advice (stocks, crypto, fund recommendations, etc.)
- All suggestions must be based on user's financial data and scores
- Use clear, warm, and actionable language
- Help users improve budgeting, savings, spending, and debt management
- If asked about investments, remind them you cannot provide investment advice and give risk warnings

【User Financial Data】
- Monthly Income: $${data.financial_data.income}
- Total Expenses: $${data.financial_data.total_expense}
- Monthly Savings: $${data.financial_data.savings}
- Monthly Debt Payment: $${data.financial_data.debt_payment}

【System-Calculated Financial Health Scores】
- Savings Capacity (30%): ${data.financial_data.score_savings} / 100
- Debt Pressure (30%): ${data.financial_data.score_debt} / 100
- Cash Flow Balance (20%): ${data.financial_data.score_cashflow} / 100
- Spending Pressure (20%): ${data.financial_data.score_spending_pressure} / 100
- Overall Score: ${data.financial_data.score_total} / 100
- Grade: ${data.financial_data.grade}

【User's Question】
"${data.user_query}"

CRITICAL LANGUAGE INSTRUCTION:
- If the user's question is in Chinese (中文), respond ENTIRELY in Chinese
- If the user's question is in English, respond ENTIRELY in English
- Match the EXACT language of the user's input
- DO NOT mix languages in your response

Respond in the following format:
----------------------------------------------------
【Analysis】
(Briefly explain key financial points related to user's question, reference relevant scores like "Your spending pressure score is only 40...")

【Suggestions】
- 2-3 practical suggestions matching user's question
- Max 25 words each
- Must be based on scores and data

【Reminder】
(Optional, one friendly reminder, max 15 words)
----------------------------------------------------
Respond STRICTLY in this format and in the SAME LANGUAGE as the user's question.`
}

async function callQwenAPI(prompt: string) {
  const qwenApiKey = process.env.QWEN_API_KEY
  if (!qwenApiKey) return null

  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${qwenApiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })

  if (!response.ok) throw new Error('Qwen API request failed')

  const result = await response.json()
  return result.choices?.[0]?.message?.content
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
    const body: AssistantRequest = await request.json()

    if (!body.user_query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const hasQwen = !!process.env.QWEN_API_KEY
    const hasClaude = !!process.env.CLAUDE_API_KEY

    if (!hasQwen && !hasClaude) {
      return NextResponse.json({ error: 'No AI service configured' }, { status: 500 })
    }

    const prompt = buildPrompt(body)
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
      return NextResponse.json({ error: 'All AI services failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      response: aiResponse
    })

  } catch (error) {
    console.error('AI Assistant API error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
