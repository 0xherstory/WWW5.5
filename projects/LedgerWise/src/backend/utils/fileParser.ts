import { Transaction } from '@/lib/constants';

/**
 * 将文件转换为 Base64 字符串
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 检测文件类型
 */
export function detectFileType(file: File): 'csv' | 'excel' | 'image' | 'pdf' | 'unknown' {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') return 'csv';
  if (['xlsx', 'xls'].includes(extension || '')) return 'excel';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return 'image';
  if (extension === 'pdf') return 'pdf';
  
  return 'unknown';
}

/**
 * 验证导入的交易数据
 */
export function validateTransaction(transaction: Partial<Transaction>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!transaction.date) {
    errors.push('缺少日期');
  }

  if (transaction.amount === undefined || transaction.amount <= 0) {
    errors.push('金额无效');
  }

  if (!transaction.category) {
    errors.push('缺少类别');
  }

  if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
    errors.push('类型无效');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 标准化日期格式为 YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // 如果无法解析，返回今天的日期
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * 标准化类别名称
 */
export function normalizeCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    '食物': 'Food',
    '餐饮': 'Food',
    '吃饭': 'Food',
    '交通': 'Transport',
    '出行': 'Transport',
    '购物': 'Shopping',
    '娱乐': 'Entertainment',
    '房租': 'Rent & Bills',
    '账单': 'Rent & Bills',
    '投资': 'Investments',
    '理财': 'Investments',
  };

  return categoryMap[category] || category || 'Other';
}

/**
 * 批量处理文件
 */
export async function processMultipleFiles(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<{ file: File; type: string; base64: string }[]> {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const type = detectFileType(file);
    const base64 = await fileToBase64(file);
    
    results.push({ file, type, base64 });
    
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }
  
  return results;
}



