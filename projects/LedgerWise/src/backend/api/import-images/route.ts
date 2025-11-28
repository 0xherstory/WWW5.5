import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { images } = await request.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少图片数据' 
      }, { status: 400 });
    }

    const transactions = [];
    const errors = [];

    // 批量处理图片
    for (let i = 0; i < images.length; i++) {
      try {
        // 调用现有的 OCR API
        const ocrResponse = await fetch(`${request.nextUrl.origin}/api/ocr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: images[i] })
        });

        const ocrResult = await ocrResponse.json();

        if (ocrResult.success && ocrResult.data) {
          transactions.push({
            ...ocrResult.data,
            id: Date.now().toString() + '-' + i
          });
        } else {
          errors.push({
            index: i,
            error: ocrResult.error || '识别失败'
          });
        }
      } catch (error: any) {
        console.error(`处理第 ${i + 1} 张图片时出错:`, error);
        errors.push({
          index: i,
          error: error.message || '处理失败'
        });
      }
    }

    if (transactions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '未能识别出任何有效的账单信息',
        details: errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('批量图片导入错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || '批量图片处理失败' 
    }, { status: 500 });
  }
}



