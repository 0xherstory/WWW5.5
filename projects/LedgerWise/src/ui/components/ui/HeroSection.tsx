'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <div className="relative pt-32 pb-12 sm:pt-40 sm:pb-16 overflow-hidden min-h-[600px] flex items-center justify-center">
      {/* Ripple Background Elements */}
      <div className="absolute inset-0 flex items-center justify-center z-0 overflow-hidden pointer-events-none">
         {/* Using animate-ping with different delays to create a continuous ripple effect */}
         <div className="absolute w-[200px] h-[200px] border border-accent/40 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
         <div className="absolute w-[350px] h-[350px] border border-accent/30 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
         <div className="absolute w-[500px] h-[500px] border border-accent/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />
         <div className="absolute w-[650px] h-[650px] border border-accent/10 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1.5s]" />
         
         {/* Static glimmering rings */}
         <div className="absolute w-[400px] h-[400px] border border-accent/10 rounded-full opacity-50" />
         <div className="absolute w-[600px] h-[600px] border border-accent/5 rounded-full opacity-30" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-accent/30 bg-white/50 backdrop-blur-sm text-accent text-xs font-semibold tracking-wide uppercase mb-8 shadow-sm">
          <Sparkles className="w-3 h-3 mr-2" />
          Finance • 2025
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-serif font-medium tracking-tight text-primary mb-6">
          Your Money. <br />
          <span className="italic text-accent relative">
            Your Data.
          </span> <br />
          Your Rules.
        </h1>
        
        <p className="mt-4 max-w-2xl mx-auto text-xl text-secondary font-light bg-white/30 backdrop-blur-sm rounded-xl p-2">
          AI-powered bookkeeping with true data sovereignty. 
          <br className="hidden sm:block" />
          Securely encrypted on the blockchain, accessible only by you.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onGetStarted}
            className="group px-8 py-4 bg-primary text-white rounded-full font-medium hover:bg-black transition-all shadow-lg hover:shadow-xl text-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Connect Your Wallet and Start
          </button>
        </div>
      </div>
    </div>
  );
};