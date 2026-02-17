"use client";


import { ReactNode } from 'react';
import { cn } from '@kit/ui/utils';

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  style?: React.CSSProperties;
}

const GlassCard = ({ 
  children, 
  className, 
  hoverEffect = false,
  style
}: GlassCardProps) => {
  return (
    <div 
      className={cn(
        'rounded-xl p-6 transition-all duration-300',
        'backdrop-blur-lg bg-white/10 border border-black/10',
        'dark:bg-white/5 dark:border-white/10',
        hoverEffect && 'hover:bg-white/20 dark:hover:bg-white/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/5',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlassCard;
