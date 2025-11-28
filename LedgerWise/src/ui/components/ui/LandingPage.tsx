import React from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { ShieldCheck, Wallet, Sparkles, Database } from 'lucide-react';

interface LandingPageProps {
  onConnectWallet: () => void;
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onConnectWallet, onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Navbar onConnectWallet={onConnectWallet} onGetStarted={onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary mb-4">Why choose LedgerWise</h2>
            <p className="text-secondary max-w-2xl mx-auto">Experience the future of personal finance with features designed for control, security, and ease of use.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Sparkles className="h-6 w-6 text-accent" />}
              title="AI Intelligence"
              description="Natural language processing automatically categorizes your transactions."
            />
             <FeatureCard 
              icon={<Wallet className="h-6 w-6 text-accent" />}
              title="Wallet Sync"
              description="Connect your Web3 wallet to instantly recover your encrypted data."
            />
             <FeatureCard 
              icon={<ShieldCheck className="h-6 w-6 text-accent" />}
              title="End-to-End Encrypted"
              description="Your financial data is encrypted with your private key."
            />
             <FeatureCard 
              icon={<Database className="h-6 w-6 text-accent" />}
              title="Decentralized"
              description="Stored on IPFS/Arweave. Permanent, censorship-resistant access."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({ icon, title, description }) => (
  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
    <p className="text-secondary text-sm leading-relaxed">{description}</p>
  </div>
);