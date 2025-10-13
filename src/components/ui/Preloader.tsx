import React, { useState, useEffect } from 'react';
import LoginPage from '../../features/auth/Validation/Login';

interface PreloaderProps {
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
}

const PreloaderAnimation: React.FC<PreloaderProps> = ({ 
  onComplete, 
  title = "Welcome", 
  subtitle = "Experience Connected and Interoperable Platform" 
}) => {
  const [stage, setStage] = useState<'drop' | 'line' | 'rectangle' | 'text' | 'expand' | 'complete'>('drop');
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const timeouts: number[] = [];

    // Stage progression
    timeouts.push(window.setTimeout(() => setStage('line'), 800));
    timeouts.push(window.setTimeout(() => setStage('rectangle'), 1400)); 
    timeouts.push(window.setTimeout(() => setStage('text'), 1900));
    timeouts.push(window.setTimeout(() => setStage('expand'), 2700));
    timeouts.push(window.setTimeout(() => setStage('complete'), 4000));
    timeouts.push(window.setTimeout(() => {
      setShowLogin(true);
      onComplete?.();
    }, 4100));

    return () => timeouts.forEach(timeout => window.clearTimeout(timeout));
  }, [onComplete]);


  if (showLogin) {
    return (
      <div className="animate-fade-in">
        <LoginPage />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center overflow-hidden">
      {/* Drop */}
      <div 
        className={`absolute transition-all duration-1200 ease-out ${
          stage === 'drop' 
            ? 'w-8 h-9 bg-gradient-to-b from-[#6FC583] to-[#549888] rounded-full rounded-b-none shadow-lg animate-dropBounce' 
            : 'opacity-0'
        }`}
        style={{
          clipPath: stage === 'drop' ? 'ellipse(50% 60% at 50% 40%)' : 'none'
        }}
      />
      
      {/* Line */}
      <div 
        className={`absolute transition-all duration-700 ease-out ${
          stage === 'line' 
            ? 'w-1 h-60 bg-gradient-to-b from-[#6FC583] to-[#549888] rounded-full shadow-lg' 
            : stage === 'drop' 
              ? 'w-8 h-9 bg-gradient-to-b from-[#6FC583] to-[#549888] rounded-full rounded-b-none shadow-lg'
              : 'opacity-0'
        }`}
        style={{
          clipPath: stage === 'line' ? 'none' : stage === 'drop' ? 'ellipse(50% 60% at 50% 40%)' : 'none'
        }}
      />
      
      {/* Rectangle */}
      <div 
        className={`absolute transition-all duration-700 ease-out flex items-center justify-center ${
          stage === 'rectangle' || stage === 'text'
            ? 'w-[480px] h-[180px] bg-gradient-to-r from-[#6FC583] to-[#549888] rounded-full shadow-xl' 
            : stage === 'line'
              ? 'w-1 h-20 bg-gradient-to-b from-[#6FC583] to-[#549888] rounded-full shadow-lg'
              : stage === 'expand'
                ? 'w-screen h-screen bg-gradient-to-br from-[#6FC583]/80 to-[#549888]/80 backdrop-blur-xl'
                : 'opacity-0'
        }`}
        style={{
          transform: stage === 'expand' ? 'scale(2)' : 'scale(1)',
          transition: stage === 'expand' 
            ? 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
            : 'all 0.7s ease-out',
        }}
      >
        {/* Text Content */}
        {(stage === 'text' || stage === 'expand') && (
          <div className={`text-center text-white px-8 ${stage === 'expand' ? 'animate-pulse opacity-20' : ''}`}>
            <h1 
              className={`text-5xl tracking-wider font-bold mb-2 transition-all duration-1200 ${
                stage === 'text' ? 'opacity-100 animate-slideFromLeft' : 'opacity-0'
              }`}
            >
              {title}
            </h1>
            <p 
              className={`opacity-90 transition-all duration-1400 ${
                stage === 'expand' ? 'text-xl md:text-2xl font-medium' : 'text-sm'
              } ${
                stage === 'text' ? 'opacity-100 animate-slideFromRight' : 'opacity-0'
              }`}
            >
              {subtitle}
            </p>
          </div>
        )}
      </div>
      
      {/* Overlay for smooth transition */}
      {stage === 'complete' && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#6FC583] to-[#549888] transition-opacity duration-500 opacity-0" />
      )}
    </div>
  );
};

export default PreloaderAnimation;