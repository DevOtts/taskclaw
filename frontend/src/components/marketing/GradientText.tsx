"use client";


import { cn } from '@kit/ui/utils';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  gradient?: 'purple-blue' | 'purple-pink';
}

const GradientText = ({ 
  children, 
  className,
  gradient = 'purple-blue' 
}: GradientTextProps) => {
  const gradients = {
    'purple-blue': 'from-brand-purple to-brand-blue',
    'purple-pink': 'from-purple-600 to-pink-500'
  };

  return (
    <span 
      className={cn(
        'bg-clip-text text-transparent bg-gradient-to-r animate-text-gradient',
        gradients[gradient],
        className
      )}
    >
      {children}
    </span>
  );
};

export default GradientText;
