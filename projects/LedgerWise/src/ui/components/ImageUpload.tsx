'use client'

import { useState } from 'react'
import { ParseResult } from '@/utils/ai'

interface ImageUploadProps {
  onImageParsed: (result: ParseResult) => void
}

export default function ImageUpload({ onImageParsed }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB')
      return
    }

    setError('')
    setIsUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Convert to base64
      const base64 = await fileToBase64(file)

      // Send to OCR API
      console.log('Sending image to OCR API...')
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64 }),
      })

      console.log('OCR API response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('OCR API error:', error)
        throw new Error(error.error || 'OCR识别失败')
      }

      const result = await response.json()
      console.log('OCR API result:', result)

      if (result.data) {
        console.log('Parsed result:', result.data)
        setParsedResult(result.data)
      } else {
        console.error('No data in result:', result)
        throw new Error('无法识别图片内容')
      }
    } catch (err: any) {
      setError(err.message || 'OCR识别失败，请重试')
      console.error('OCR error:', err)
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfirm = () => {
    if (parsedResult) {
      onImageParsed(parsedResult)
      setParsedResult(null)
      setPreview(null)
      setError('')
    }
  }

  const handleCancel = () => {
    setParsedResult(null)
    setPreview(null)
    setError('')
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">拍照识别</h2>

      {!parsedResult ? (
        <div className="space-y-4">
          {/* File Input */}
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">点击上传</span> 或 拖拽图片
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, JPEG (最大 5MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              {!isUploading && (
                <button
                  onClick={handleCancel}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {isUploading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">识别中...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Tips */}
          {!preview && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm font-medium mb-1">拍照技巧：</p>
              <ul className="text-blue-700 text-xs space-y-1">
                <li>• 确保小票/发票文字清晰可见</li>
                <li>• 光线充足，避免反光</li>
                <li>• 平整拍摄，避免倾斜</li>
                <li>• 包含金额和商家信息</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview Image */}
          {preview && (
            <div className="relative">
              <img
                src={preview}
                alt="识别的图片"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Parsed Result */}
          <div className={`p-4 rounded-md ${parsedResult.type === 'income' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className="font-medium mb-2">识别结果：</h3>
            <div className="space-y-1 text-sm">
              <div>类型: {parsedResult.type === 'income' ? '收入' : '支出'}</div>
              <div>金额: ¥{parsedResult.amount}</div>
              <div>分类: {parsedResult.category}</div>
              <div>日期: {parsedResult.date}</div>
              <div>描述: {parsedResult.description}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              确认记账
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
            >
              重新上传
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = error => reject(error)
  })
}
