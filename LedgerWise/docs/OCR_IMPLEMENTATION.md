# OCR Image Recognition Implementation

## Overview
Phase 2 adds OCR (Optical Character Recognition) capabilities to the AI Web3 Expense Tracker, allowing users to scan receipt images and automatically extract transaction information.

## Features

### 1. Image Upload Component
**Location**: `/components/ImageUpload.tsx`

**Capabilities**:
- Upload receipt/invoice images via file picker
- Mobile camera integration (capture="environment")
- Image preview before processing
- Drag-and-drop support
- File validation (type and size)
- Real-time OCR processing feedback

**Technical Details**:
```typescript
// Supported formats
accept="image/*"

// Max file size
5MB (5 * 1024 * 1024 bytes)

// Base64 conversion for API transmission
fileToBase64(file): Promise<string>
```

### 2. OCR API Endpoint
**Location**: `/app/api/ocr/route.ts`

**AI Vision Models Used**:
1. **Primary**: Qwen-VL-Max (通义千问视觉模型)
   - Model: `qwen-vl-max`
   - Endpoint: `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`
   - Supports Chinese receipts natively

2. **Fallback**: Claude Vision (Anthropic)
   - Model: `claude-3-haiku-20240307`
   - Endpoint: `https://api.anthropic.com/v1/messages`
   - Good multilingual support

**Extraction Logic**:
```typescript
interface OCRResult {
  type: 'expense' | 'income'    // Transaction type
  amount: number                 // Numeric amount
  category: string              // Auto-categorized
  date: string                  // YYYY-MM-DD format
  description: string           // Brief description
}
```

### 3. Integration with Main App
**Location**: `/app/page.tsx`

**UI Layout**:
```
┌─────────────────────────────────────────┐
│  Text Input Form  │  Image Upload       │
├─────────────────────────────────────────┤
│  Today's Transactions                   │
├─────────────────────────────────────────┤
│  Monthly Statistics                     │
└─────────────────────────────────────────┘
```

Both input methods feed into the same `handleAddTransaction` flow.

## How It Works

### Step-by-Step Flow

1. **User Uploads Image**
   - Click upload area or drag image
   - Mobile: Can use camera directly
   - Preview shown immediately

2. **Image Processing**
   ```
   Image File
     ↓
   Base64 Encoding
     ↓
   POST /api/ocr
     ↓
   AI Vision Analysis (Qwen VL / Claude Vision)
     ↓
   JSON Extraction
     ↓
   Validation
     ↓
   Return ParseResult
   ```

3. **Transaction Creation**
   - Same flow as text input
   - Encryption (if wallet connected)
   - IPFS upload (optional)
   - LocalStorage save
   - UI update

### AI Prompt Engineering

**Prompt sent to AI vision models**:
```
这是一张消费小票或发票的图片。请分析图片内容并提取以下信息：

要求：
1. 提取金额（单位：元）
2. 判断交易类型（支出还是收入）
3. 根据内容判断分类
4. 提取日期（如果有），否则使用今天的日期
5. 简短描述交易内容

支出分类：餐饮、交通、购物、娱乐、其他
收入分类：工资、转账、其他

请返回JSON格式，例如：
{
  "type": "expense",
  "amount": 68.5,
  "category": "餐饮",
  "date": "2025-11-23",
  "description": "午餐"
}

只返回JSON，不要其他说明。
```

## Environment Variables

Add to `.env.local`:

```env
# Existing variables
QWEN_API_KEY=sk-xxx
CLAUDE_API_KEY=sk-ant-xxx
PINATA_JWT=eyJhbGc...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx
```

**Note**: At least one AI API key (Qwen or Claude) is required for OCR functionality.

## API Documentation

### POST `/api/ocr`

**Request**:
```json
{
  "image": "base64_encoded_image_data"
}
```

**Response** (Success):
```json
{
  "data": {
    "type": "expense",
    "amount": 68.5,
    "category": "餐饮",
    "date": "2025-11-23",
    "description": "午餐"
  }
}
```

**Response** (Error):
```json
{
  "error": "错误描述"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid request or unable to extract info
- `500`: Server error or AI API failure

## Testing Guide

### 1. Setup
```bash
# Ensure dependencies are installed
npm install

# Configure environment variables
# Add QWEN_API_KEY or CLAUDE_API_KEY to .env.local

# Start dev server
npm run dev
```

### 2. Test Cases

**Test Case 1: Restaurant Receipt**
- Upload a restaurant receipt image
- Expected: `type: "expense"`, `category: "餐饮"`
- Verify amount and description are correct

**Test Case 2: Transportation Receipt**
- Upload a taxi/rideshare receipt
- Expected: `type: "expense"`, `category: "交通"`
- Check date extraction

**Test Case 3: Shopping Receipt**
- Upload a retail store receipt
- Expected: `type: "expense"`, `category: "购物"`
- Verify item description

**Test Case 4: Salary Statement**
- Upload a payroll image
- Expected: `type: "income"`, `category: "工资"`
- Confirm amount parsing

**Test Case 5: Poor Quality Image**
- Upload a blurry/dark image
- Expected: Error message with helpful guidance
- Verify user can retry or switch to text input

### 3. Mobile Testing
```bash
# Access from mobile device on same network
npm run dev
# Visit http://YOUR_LOCAL_IP:3000

# Test camera capture feature
# Verify touch interactions
# Check responsive layout
```

## Best Practices for Users

### Photography Tips (显示在UI中)
1. ✅ 确保小票/发票文字清晰可见
2. ✅ 光线充足，避免反光
3. ✅ 平整拍摄，避免倾斜
4. ✅ 包含金额和商家信息

### What Works Best
- **Good Lighting**: Natural light or bright indoor lighting
- **Flat Surface**: Receipt laid flat on table
- **Full Frame**: Entire receipt visible in photo
- **Focus**: Text is sharp and readable

### Common Issues
| Issue | Cause | Solution |
|-------|-------|----------|
| "无法识别图片" | Blurry image | Retake with better focus |
| Wrong amount | Glare/reflection | Avoid flash, use indirect light |
| Wrong category | Unclear merchant name | Add manual description after |
| Missing date | Receipt too old/faded | Use text input instead |

## Technical Implementation Details

### Qwen VL API Integration
```typescript
const response = await fetch(
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  {
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
              { type: 'image', image: `data:image/jpeg;base64,${imageBase64}` },
              { type: 'text', text: prompt }
            ]
          }
        ]
      }
    })
  }
)
```

### Claude Vision API Integration
```typescript
const response = await fetch(
  'https://api.anthropic.com/v1/messages',
  {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64
            }
          },
          { type: 'text', text: prompt }
        ]
      }]
    })
  }
)
```

### JSON Extraction Logic
```typescript
function extractJSON(text: string): OCRResult | null {
  // Handle markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  const jsonString = jsonMatch ? jsonMatch[1] : text
  
  const parsed = JSON.parse(jsonString)
  
  // Validate required fields
  if (!parsed.amount || !parsed.category || !parsed.date) {
    return null
  }
  
  return {
    type: parsed.type || 'expense',
    amount: parseFloat(parsed.amount),
    category: parsed.category,
    date: parsed.date,
    description: parsed.description || ''
  }
}
```

## Performance Considerations

### Response Times
- **Qwen VL**: ~2-4 seconds
- **Claude Vision**: ~3-5 seconds
- **Total with fallback**: Up to 9 seconds

### Optimization Tips
1. Compress images before upload (if > 1MB)
2. Use JPEG format (smaller than PNG)
3. Show loading indicator during processing
4. Implement request timeout (30s)

### Rate Limits
- **Qwen**: Check DashScope dashboard
- **Claude**: ~50 requests/min (Haiku)

## Security Considerations

1. **API Keys**: Server-side only (never expose to client)
2. **Image Data**: Transmitted as base64, not stored on server
3. **Privacy**: Images processed in-memory only
4. **Encryption**: Transaction data encrypted before IPFS upload

## Troubleshooting

### Error: "无法识别图片"
**Possible Causes**:
- No AI API key configured
- Both Qwen and Claude APIs failed
- Network connectivity issues

**Solutions**:
1. Check `.env.local` has valid API keys
2. Verify API key permissions
3. Check console for detailed error logs

### Error: "请上传图片文件"
**Cause**: Invalid file type

**Solution**: Ensure file is image format (JPEG, PNG, etc.)

### Error: "图片大小不能超过5MB"
**Cause**: File too large

**Solution**: 
- Use image compression tool
- Take photo at lower resolution

## Future Enhancements (Phase 3)

- [ ] Batch upload multiple receipts
- [ ] Image preprocessing (auto-rotate, enhance contrast)
- [ ] Receipt template learning (improve accuracy over time)
- [ ] Offline OCR using TensorFlow.js
- [ ] Receipt photo history (for re-processing)
- [ ] Multi-language support beyond Chinese
- [ ] QR code detection for digital receipts

## Cost Estimation

### API Costs (approximate)
- **Qwen VL-Max**: ¥0.02 per image
- **Claude Haiku**: $0.00025 per image

For a typical user:
- 5 receipts/day × 30 days = 150 images/month
- Monthly cost: ~¥3 or $0.04

Very affordable for a hackathon demo!

## Related Files

```
components/
  └── ImageUpload.tsx          # New component

app/
  └── api/
      └── ocr/
          └── route.ts         # New API endpoint
  └── page.tsx                 # Updated (integrated component)

.env.local
  └── QWEN_API_KEY            # Required for Qwen VL
  └── CLAUDE_API_KEY          # Required for Claude Vision (fallback)
```

## Status

✅ **Phase 2 - OCR Implementation Complete**

**Ready for**:
- Development testing
- User acceptance testing
- Demo deployment

**Prerequisites**:
1. Run `npm install` (dependencies already in package.json)
2. Add AI API key to `.env.local`
3. Test with sample receipt images

---

**Next Steps**: 
1. Test OCR with real receipts
2. Adjust prompts based on accuracy
3. Add more error handling for edge cases
4. Consider Phase 3 enhancements
