"use client";

import React from 'react';
import Button from './Button';
import { cn } from '@kit/ui/utils';

interface CtaButtonProps extends React.ComponentProps<typeof Button> {
  // Any additional props specific to CtaButton
  gradientBorder?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * CtaButton - A specialized Button component for Call-to-Action buttons
 * Automatically applies the fake door validation when NEXT_PUBLIC_FAKEDOOR_ENABLE=true
 */
const CtaButton = ({ 
  children,
  className,
  gradientBorder = false,
  ignoreFakeDoor = false,
  ctaId = 'main-cta',
  onClick,
  ...props 
}: CtaButtonProps) => {
  return (
    <div
      className={cn('relative', {
        'p-[2px] before:absolute before:inset-0 before:rounded-md before:p-[2px] before:bg-gradient-to-r before:from-brand-purple before:via-brand-blue before:to-brand-purple before:content-[""]': gradientBorder,
      })}
    >
      <Button
        isCta={true} // Mark as CTA for fake door functionality
        ctaId={ctaId}
        ignoreFakeDoor={ignoreFakeDoor}
        onClick={onClick}
        className={cn(
          'relative',
          {
            'bg-background text-foreground w-full hover:bg-foreground/5': gradientBorder,
          },
          className
        )}
        {...props}
      >
        {children}
      </Button>
    </div>
  );
};

export default CtaButton; 