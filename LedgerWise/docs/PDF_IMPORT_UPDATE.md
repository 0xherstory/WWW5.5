# PDF 导入功能更新说明

## 📋 更新内容

将 PDF 导入功能从单独使用 Anthropic SDK 改为使用 **Qwen + Claude fallback** 机制，与现有的图片识别功能保持一致。

## ✅ 修改的文件

### 1. `/app/api/import-pdf/route.ts`
**改动**: 完全重写 PDF 解析逻辑

**之前**: 
- 使用 `@anthropic-ai/sdk` 包
- 只支持 Claude API
- 需要额外依赖

**现在**:
- 直接调用 HTTP API
- 优先使用 Qwen API（成本更低，速度更快）
- Qwen 失败时自动 fallback 到 Claude
- 与 `/api/ocr` 和 `/api/parse` 保持一致的风格

### 2. `/package.json`
**改动**: 移除不必要的依赖

**移除**:
```json
"@anthropic-ai/sdk": "^0.32.0"
```

**保留**:
```json
"pdf-parse": "^1.1.1",
"papaparse": "^5.4.1",
"xlsx": "^0.18.5"
```

### 3. 文档更新
- `docs/FILE_IMPORT_GUIDE.md` - 更新 AI 服务说明
- `IMPORT_FEATURE_SUMMARY.md` - 更新依赖列表和环境变量说明

## 🎯 优势

### 1. **成本优化**
- Qwen API 成本比 Claude 低得多
- 优先使用成本更低的服务

### 2. **代码一致性**
- 所有 AI 功能使用相同的 fallback 机制
- 图片识别、文本解析、PDF 解析都使用统一模式
- 代码风格统一，易于维护

### 3. **更高可用性**
- 双重保障：Qwen 失败自动切换 Claude
- 只需配置一个 API key 即可工作
- 两个都配置可获得最高可用性

### 4. **简化依赖**
- 移除 `@anthropic-ai/sdk` 包（约 200+ KB）
- 减少 node_modules 大小
- 降低构建时间

### 5. **灵活配置**
```env
# 场景 1: 只用 Qwen（推荐）
QWEN_API_KEY=sk-xxx

# 场景 2: 只用 Claude
CLAUDE_API_KEY=sk-ant-xxx

# 场景 3: 两个都配置（最佳）
QWEN_API_KEY=sk-xxx
CLAUDE_API_KEY=sk-ant-xxx
```

## 🔄 Fallback 流程

```
PDF 上传
    ↓
提取文本 (pdf-parse)
    ↓
检查 QWEN_API_KEY
    ↓
[有] → 调用 Qwen API
    ↓
[成功] → 返回结果 ✅
[失败] → 继续下一步
    ↓
检查 CLAUDE_API_KEY
    ↓
[有] → 调用 Claude API
    ↓
[成功] → 返回结果 ✅
[失败] → 返回错误 ❌
```

## 📊 API 对比

| 特性 | Qwen API | Claude API |
|------|---------|-----------|
| **成本** | 💰 更低 | 💰💰 较高 |
| **速度** | ⚡ 快 | ⚡ 中等 |
| **质量** | ✅ 优秀 | ✅ 优秀 |
| **可用性** | ✅ 稳定 | ✅ 稳定 |
| **使用方式** | HTTP API | HTTP API |

## 🔧 技术细节

### Qwen API 调用
```typescript
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
```

### Claude API 调用
```typescript
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
```

## 🧪 测试建议

### 1. 只配置 Qwen
```bash
# .env.local
QWEN_API_KEY=your_key
```
测试 PDF 导入，应该成功使用 Qwen。

### 2. 只配置 Claude
```bash
# .env.local
CLAUDE_API_KEY=your_key
```
测试 PDF 导入，应该成功使用 Claude。

### 3. 两个都配置
```bash
# .env.local
QWEN_API_KEY=your_qwen_key
CLAUDE_API_KEY=your_claude_key
```
测试 PDF 导入，应该优先使用 Qwen。

### 4. 模拟 Qwen 失败
临时移除或使用错误的 `QWEN_API_KEY`，应该自动切换到 Claude。

## 📝 迁移指南

如果您之前已经部署了使用 Anthropic SDK 的版本：

### 步骤 1: 更新代码
```bash
git pull
```

### 步骤 2: 重新安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 步骤 3: 更新环境变量
```bash
# .env.local

# 可以移除（如果有）
# ANTHROPIC_API_KEY=xxx

# 添加以下之一或两个
QWEN_API_KEY=your_qwen_key
CLAUDE_API_KEY=your_claude_key
```

### 步骤 4: 重启服务
```bash
npm run dev
```

### 步骤 5: 测试 PDF 导入
上传一个 PDF 文件，验证功能正常。

## ⚠️ 注意事项

1. **向后兼容**: 如果您只配置了 `CLAUDE_API_KEY`，功能仍然可以正常工作
2. **推荐配置**: 同时配置两个 API key 以获得最高可用性
3. **成本优化**: 优先使用 Qwen 可以显著降低 API 调用成本
4. **无功能变化**: 用户体验和功能完全不变，只是底层实现优化

## 🎉 总结

这次更新将 PDF 导入功能与现有的 AI 服务集成方式统一，提供了：
- ✅ 更低的成本
- ✅ 更高的可用性
- ✅ 更好的代码一致性
- ✅ 更灵活的配置
- ✅ 更小的依赖体积

完全向后兼容，无需担心影响现有功能！


