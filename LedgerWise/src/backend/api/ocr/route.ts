import { NextRequest, NextResponse } from 'next/server'

const QWEN_API_KEY = process.env.QWEN_API_KEY
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY

interface OCRResult {
  amount: number
  category: string
  date: string
  description: string
  type: 'expense' | 'income'
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: '请提供图片数据' },
        { status: 400 }
      )
    }

    let result: OCRResult | null = null

    // Try Qwen VL first
    if (QWEN_API_KEY) {
      try {
        result = await callQwenVL(image)
        console.log('Qwen VL OCR result:', result)
      } catch (error) {
        console.error('Qwen VL failed:', error)
      }
    }

    // Fallback to Claude Vision
    if (!result && CLAUDE_API_KEY) {
      try {
        result = await callClaudeVision(image)
        console.log('Claude Vision OCR result:', result)
      } catch (error) {
        console.error('Claude Vision failed:', error)
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: '无法识别图片，请确保配置了AI API密钥' },
        { status: 500 }
      )
    }

    // Validate result
    if (!result.amount || !result.category || !result.date) {
      return NextResponse.json(
        { error: '无法从图片中提取完整信息，请重试或手动输入' },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('OCR error:', error)
    return NextResponse.json(
      { error: error.message || 'OCR识别失败' },
      { status: 500 }
    )
  }
}

async function callQwenVL(imageBase64: string): Promise<OCRResult | null> {
  const prompt = `
This is a receipt or invoice image. Please analyze the content and extract the following information:

Requirements:
1. Extract amount (in the original currency)
2. Determine transaction type (expense or income)
3. Categorize based on content
4. Extract date (if available), otherwise use today's date
5. Brief description of the transaction

Expense categories: Rent & Bills, Food, Shopping, Transport, Entertainment, Investments
Income categories: Salary, Transfer, Other

Return JSON format, example:
{
  "type": "expense",
  "amount": 68.5,
  "category": "Food",
  "date": "2025-11-23",
  "description": "午餐"
}

Return ONLY JSON, no other explanation.`

  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QWEN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-vl-max',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image: `data:image/jpeg;base64,${imageBase64}`,
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Qwen VL API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.output?.choices?.[0]?.message?.content?.[0]?.text

  if (!content) {
    return null
  }

  return extractJSON(content)
}

async function callClaudeVision(imageBase64: string): Promise<OCRResult | null> {
  const prompt = `
This is a receipt or invoice image. Please analyze the content and extract the following information:

Requirements:
1. Extract amount (in the original currency)
2. Determine transaction type (expense or income)
3. Categorize based on content
4. Extract date (if available), otherwise use today's date
5. Brief description of the transaction

Expense categories: Rent & Bills, Food, Shopping, Transport, Entertainment, Investments
Income categories: Salary, Transfer, Other

Return JSON format, example:
{
  "type": "expense",
  "amount": 68.5,
  "category": "Food",
  "date": "2025-11-23",
  "description": "午餐"
}

Return ONLY JSON, no other explanation.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude Vision API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text

  if (!content) {
    return null
  }

  return extractJSON(content)
}

function extractJSON(text: string): OCRResult | null {
  try {
    console.log('Extracting JSON from:', text)

    let jsonString = text.trim()

    // Try to extract JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1]
    } else {
      // Try to find JSON object in the text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }
    }

    console.log('JSON string to parse:', jsonString)
    const parsed = JSON.parse(jsonString)
    console.log('Parsed JSON:', parsed)

    // Validate required fields
    if (!parsed.amount || !parsed.category || !parsed.date) {
      console.error('Missing required fields:', { amount: parsed.amount, category: parsed.category, date: parsed.date })
      return null
    }

    const result = {
      type: parsed.type || 'expense',
      amount: parseFloat(parsed.amount),
      category: parsed.category,
      date: parsed.date,
      description: parsed.description || '',
    }

    console.log('Extracted result:', result)
    return result
  } catch (error) {
    console.error('JSON extraction error:', error)
    console.error('Original text was:', text)
    return null
  }
}
