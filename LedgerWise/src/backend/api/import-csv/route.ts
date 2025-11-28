import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { normalizeDate, normalizeCategory } from '@/utils/fileParser';

export async function POST(request: NextRequest) {
  try {
    const { fileData, fileName } = await request.json();
    
    if (!fileData) {
      return NextResponse.json({ success: false, error: '缺少文件数据' }, { status: 400 });
    }

    // 解码 Base64
    const buffer = Buffer.from(fileData, 'base64');
    
    // 读取 Excel/CSV 文件
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 转换为 JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: '文件数据不足，至少需要标题行和一行数据' 
      }, { status: 400 });
    }

    // 检测列标题（支持中英文）
    const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
    
    // 映射列索引
    const columnMap = {
      date: findColumnIndex(headers, ['日期', 'date', '时间']),
      amount: findColumnIndex(headers, ['金额', 'amount', '数额']),
      category: findColumnIndex(headers, ['类别', 'category', '分类']),
      description: findColumnIndex(headers, ['描述', 'description', '备注', 'memo']),
      type: findColumnIndex(headers, ['类型', 'type', '收支'])
    };

    // 验证必需列
    if (columnMap.date === -1 || columnMap.amount === -1) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必需列：日期、金额。请确保文件包含这些列' 
      }, { status: 400 });
    }

    // 解析数据行
    const transactions = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // 跳过空行
      if (!row || row.length === 0 || !row[columnMap.date]) continue;

      try {
        const amount = parseFloat(String(row[columnMap.amount] || '0').replace(/[^0-9.-]/g, ''));
        if (isNaN(amount) || amount <= 0) continue;

        const rawType = columnMap.type !== -1 ? String(row[columnMap.type] || '').toLowerCase() : '';
        let type: 'income' | 'expense' = 'expense';
        
        // 判断类型（支持中英文）
        if (rawType.includes('income') || rawType.includes('收入') || rawType.includes('入账')) {
          type = 'income';
        } else if (rawType.includes('expense') || rawType.includes('支出') || rawType.includes('花费')) {
          type = 'expense';
        }

        const transaction = {
          id: Date.now().toString() + '-' + i,
          date: normalizeDate(String(row[columnMap.date])),
          amount: Math.abs(amount),
          category: columnMap.category !== -1 
            ? normalizeCategory(String(row[columnMap.category] || 'Other'))
            : 'Other',
          description: columnMap.description !== -1 
            ? String(row[columnMap.description] || '导入的交易')
            : '导入的交易',
          type
        };

        transactions.push(transaction);
      } catch (error) {
        console.error(`解析第 ${i + 1} 行时出错:`, error);
        continue;
      }
    }

    if (transactions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '未能解析出有效的交易数据' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length
    });

  } catch (error: any) {
    console.error('CSV/Excel 导入错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || '文件解析失败，请检查文件格式' 
    }, { status: 500 });
  }
}

// 辅助函数：查找列索引
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name));
    if (index !== -1) return index;
  }
  return -1;
}



