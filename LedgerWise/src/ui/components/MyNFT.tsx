'use client'

import { useState } from 'react'

interface MyNFTProps {
  isOpen: boolean
  onClose: () => void
  nftImage?: string // NFT图片URL，你待会上传后我们再更新
  userName?: string
}

export default function MyNFT({ isOpen, onClose, nftImage, userName }: MyNFTProps) {
  if (!isOpen) return null

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 overflow-y-auto"
        onClick={onClose}
      >
        {/* 居中容器 */}
        <div className="min-h-full flex items-center justify-center p-4">
          {/* 弹窗内容 */}
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-4 overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
          {/* 关闭按钮 */}
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* NFT Image Display Area */}
          <div className="bg-gradient-to-br from-amber-300 via-amber-200 to-yellow-200 p-3 sm:p-6">
            <div className="bg-white rounded-xl p-2 sm:p-3 shadow-lg flex justify-center">
              {nftImage ? (
                <img
                  src={nftImage}
                  alt="First Expense NFT"
                  className="max-w-xs w-full h-auto rounded-lg max-h-[300px] object-contain"
                />
              ) : (
                <img
                  src="/nft-images/first-expense-nft.jpg"
                  alt="First Expense NFT"
                  className="max-w-xs w-full h-auto rounded-lg max-h-[300px] object-contain"
                />
              )}
            </div>
          </div>

          {/* Congratulations Text Area */}
          <div className="p-4 sm:p-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2 sm:mb-3">
              🎉 Amazing! Congratulations!
            </h2>
            <p className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              You've completed your first expense record!
            </p>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              You've successfully unlocked your exclusive <span className="font-bold text-amber-600">"First Expense NFT"</span>
            </p>

            {/* NFT Info Card */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600">🏷️ NFT Name:</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-800">First Expense NFT</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600">✨ Rarity:</span>
                <span className="text-xs sm:text-sm font-semibold text-amber-600">Legendary</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">⛓️ On-chain Status:</span>
                <span className="text-xs sm:text-sm font-semibold text-green-600">Permanently Minted</span>
              </div>
            </div>

            {/* Motivational Text */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-medium">
                🌟 This is the <span className="text-orange-600 font-bold">first step</span> of your journey to financial freedom!<br />
                <span className="text-amber-600">Every expense record is an investment in your future</span>,<br />
                Keep going, more exciting achievements await you! 💪
              </p>
            </div>

            {/* Confirm Button */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-lg hover:from-amber-700 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🎊 Let's Start the Journey!
            </button>

            {/* Hint Text */}
            <p className="text-xs text-gray-500 mt-2 sm:mt-3">
              💼 You can view this exclusive NFT in your wallet anytime
            </p>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
