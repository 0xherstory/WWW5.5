import { NextRequest, NextResponse } from 'next/server';

// @ts-ignore - pdf-parse doesn't have proper types
const pdf = require('pdf-parse');

const QWEN_API_KEY = process.env.QWEN_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

async function callQwenAPI(extractedText: string) {
  if (!QWEN_API_KEY) return null;

  const prompt = `请从以下 PDF 文本中提取所有账单/交易信息，并以 JSON 数组格式返回。

每个交易必须包含：
- date: 日期（YYYY-MM-DD 格式）**这是必填字段**
- amount: 金额（数字）
- category: 类别（Food, Transport, Shopping, Entertainment, Rent & Bills, Investments, Other 之一）
- description: 描述
- type: 类型（income 或 expense）

**关于日期提取的重要说明：**
1. 必须从 PDF 原文中提取每笔交易的真实日期
2. 查找日期格式如："2024-11-01", "Nov 1, 2024", "2024/11/01", "11月1日"
3. 如果交易描述中提到月份（如"11月工资"、"October rent"），使用该月的第1天
4. 如果只有月份没有具体日期，使用该月的第1天
5. **严禁使用今天的日期或相同日期填充所有交易**
6. 每笔交易应该有各自的真实日期

PDF 文本内容：
${extractedText.substring(0, 3000)}

请只返回 JSON 数组，不要包含任何其他文字。格式如下：
[{"date":"2024-01-15","amount":50.00,"category":"Food","description":"午餐","type":"expense"}]`;

  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QWEN_API_KEY}`,
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
  });

  if (!response.ok) {
    throw new Error(`Qwen API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.output?.choices?.[0]?.message?.content;
}

async function callClaudeAPI(extractedText: string) {
  if (!CLAUDE_API_KEY) return null;

  const prompt = `请从以下 PDF 文本中提取所有账单/交易信息，并以 JSON 数组格式返回。

每个交易必须包含：
- date: 日期（YYYY-MM-DD 格式）**这是必填字段**
- amount: 金额（数字）
- category: 类别（Food, Transport, Shopping, Entertainment, Rent & Bills, Investments, Other 之一）
- description: 描述
- type: 类型（income 或 expense）

**关于日期提取的重要说明：**
1. 必须从 PDF 原文中提取每笔交易的真实日期
2. 查找日期格式如："2024-11-01", "Nov 1, 2024", "2024/11/01", "11月1日"
3. 如果交易描述中提到月份（如"11月工资"、"October rent"），使用该月的第1天
4. 如果只有月份没有具体日期，使用该月的第1天
5. **严禁使用今天的日期或相同日期填充所有交易**
6. 每笔交易应该有各自的真实日期

PDF 文本内容：
${extractedText.substring(0, 3000)}

请只返回 JSON 数组，不要包含任何其他文字。格式如下：
[{"date":"2024-01-15","amount":50.00,"category":"Food","description":"午餐","type":"expense"}]`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.content?.[0]?.text;
}

export async function POST(request: NextRequest) {
  try {
    const { fileData } = await request.json();
    
    if (!fileData) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少 PDF 文件数据' 
      }, { status: 400 });
    }

    // 解码 Base64
    const buffer = Buffer.from(fileData, 'base64');
    
    // 解析 PDF
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({ 
        success: false, 
        error: 'PDF 中未找到足够的文本内容，可能是扫描件或图片 PDF' 
      }, { status: 400 });
    }

    let aiResponse = null;

    // 优先使用 Qwen，失败后 fallback 到 Claude
    try {
      if (QWEN_API_KEY) {
        console.log('尝试使用 Qwen API 解析 PDF...');
        aiResponse = await callQwenAPI(extractedText);
      }
    } catch (error) {
      console.error('Qwen API 失败，尝试 Claude...', error);
    }

    if (!aiResponse && CLAUDE_API_KEY) {
      try {
        console.log('使用 Claude API 解析 PDF...');
        aiResponse = await callClaudeAPI(extractedText);
      } catch (error) {
        console.error('Claude API 也失败了:', error);
      }
    }

    if (!aiResponse) {
      return NextResponse.json({ 
        success: false, 
        error: '未配置 AI 服务或所有 AI 服务均失败' 
      }, { status: 500 });
    }

    // 解析 AI 返回的 JSON
    let transactions = [];
    try {
      // 提取 JSON 数组
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/) || 
                       aiResponse.match(/```json\s*(\[[\s\S]*?\])\s*```/) ||
                       aiResponse.match(/```\s*(\[[\s\S]*?\])\s*```/);
      
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      const parsedData = JSON.parse(jsonString.trim());

      // Validate dates are diverse
      const dates = parsedData.map((item: any) => item.date).filter(Boolean);
      const uniqueDates = new Set(dates);

      // Warn if all dates are the same (likely AI failed to extract real dates)
      if (dates.length > 1 && uniqueDates.size === 1) {
        console.warn('⚠️ 警告: 所有交易使用相同日期，AI 可能未正确提取日期');
      }

      transactions = parsedData.map((item: any, index: number) => ({
        id: Date.now().toString() + '-' + index,
        date: item.date || new Date().toISOString().split('T')[0],
        amount: parseFloat(item.amount) || 0,
        category: item.category || 'Other',
        description: item.description || 'PDF 导入',
        type: item.type || 'expense'
      }));
    } catch (parseError) {
      console.error('解析 AI 返回的 JSON 失败:', parseError);
      console.error('AI 原始响应:', aiResponse);
      return NextResponse.json({ 
        success: false, 
        error: 'AI 解析失败，请确保 PDF 包含有效的账单信息' 
      }, { status: 400 });
    }

    if (transactions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '未能从 PDF 中提取出有效的账单信息' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length
    });

  } catch (error: any) {
    console.error('PDF 导入错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'PDF 处理失败' 
    }, { status: 500 });
  }
}


