'use client';

import React from 'react';
import { LayoutDashboard, Wallet, Target, Sparkles, PieChart, Settings, HelpCircle, LogOut, Award } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isCollapsed }) => {
  const widthClass = isCollapsed ? 'w-20' : 'w-64';

  const NavItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => {
    const isActive = currentPage === id;
    return (
      <button
        onClick={() => onNavigate(id)}
        className={`w-full flex items-center px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-primary text-white shadow-md' 
            : 'text-secondary hover:bg-gray-100'
        }`}
      >
        <Icon className={`h-5 w-5 ${isActive ? 'text-accent' : 'text-gray-400'} ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
        {!isCollapsed && <span className="font-medium text-sm">{label}</span>}
      </button>
    );
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ${widthClass} z-40`}>
      <div className="h-20 flex items-center px-6">
        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-serif font-bold flex-shrink-0">
          L
        </div>
        {!isCollapsed && <span className="ml-3 font-serif text-xl font-bold text-primary">LedgerWise</span>}
      </div>

      <div className="flex-1 px-3 py-6 overflow-y-auto no-scrollbar">
        {!isCollapsed && <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">General</div>}
        <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem id="budgeting" icon={PieChart} label="Budgeting & Expenses" />
        <NavItem id="savings" icon={Target} label="Savings & Goals" />
        <NavItem id="transactions" icon={Wallet} label="Transactions" />

        <div className="my-6 border-t border-gray-100" />

        {!isCollapsed && <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Insights</div>}
        <NavItem id="assistant" icon={Sparkles} label="AI Assistant" />

        <div className="my-6 border-t border-gray-100" />

        {!isCollapsed && <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">NFTs</div>}
        <NavItem id="nfts" icon={Award} label="NFTs" />

        <div className="my-6 border-t border-gray-100" />
        
        {!isCollapsed && <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Settings</div>}
        <NavItem id="settings" icon={Settings} label="Settings" />
        <NavItem id="help" icon={HelpCircle} label="Help & Support" />
      </div>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center px-4 py-3 rounded-xl text-danger hover:bg-red-50 transition-colors">
          <LogOut className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};