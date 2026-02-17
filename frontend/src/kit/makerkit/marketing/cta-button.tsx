import { cn } from '../../lib/utils';
import { Button } from '../../shadcn/button';

interface CtaButtonProps extends React.ComponentProps<typeof Button> {
  gradientBorder?: boolean;
}

export const CtaButton: React.FC<CtaButtonProps> = function CtaButtonComponent({
  className,
  children,
  gradientBorder,
  ...props
}) {
  return (
    <div
      className={cn('rounded-xl relative group', {
        'p-[2px] before:absolute before:inset-0 before:rounded-xl before:p-[2px] before:bg-gradient-to-r before:from-[#4c24b0] before:via-[#f24db0] before:to-[#4c24b0] before:content-[""]': gradientBorder,
      })}
    >
      <Button
        className={cn(
          'h-12 rounded-xl px-8 text-base font-semibold relative',
          {
            'dark:shadow-primary/30 transition-all hover:shadow-2xl':
              props.variant === 'default' || !props.variant,
            'bg-[#0A0A0A] text-white w-full hover:bg-[#141414]': gradientBorder,
          },
          className,
        )}
        asChild
        {...props}
      >
        {children}
      </Button>
    </div>
  );
};
