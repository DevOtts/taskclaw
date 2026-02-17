import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/brand-logo';

export function AppLogo({ className, href = '/' }: { className?: string; href?: string }) {
    return (
        <Link href={href} className={cn('block', className)}>
            <BrandLogo variant="horizontal" className="w-full" />
        </Link>
    );
}
