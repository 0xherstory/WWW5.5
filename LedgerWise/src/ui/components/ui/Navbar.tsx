'use client';

import React from 'react';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onConnectWallet: () => void;
  onGetStarted: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onConnectWallet }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-serif font-bold mr-2">
              L
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-primary">LedgerWise</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#why-choose-ledgerwise" className="text-secondary hover:text-primary transition-colors text-sm font-medium">Features</a>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={onConnectWallet}
              className="hidden md:inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-accent hover:bg-[#bfa05a] transition-all shadow-md hover:shadow-lg"
            >
              Connect Wallet
            </button>
            <div className="md:hidden">
              <button className="text-gray-500 hover:text-gray-900">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};