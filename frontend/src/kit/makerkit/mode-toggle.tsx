'use client';

import { useEffect, useMemo, useState } from 'react';

import { Moon, Sun, Monitor } from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from '../shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../shadcn/dropdown-menu';
import { Trans } from './trans';
import { useAppTheme } from '@/components/theme/useAppTheme';
import type { ThemeMode } from '@/theme/theme.types';

const THEMES = [
  { value: 'light', i18nKey: 'common:lightTheme', fallback: 'Light', icon: Sun },
  { value: 'dark', i18nKey: 'common:darkTheme', fallback: 'Dark', icon: Moon },
  { value: 'system', i18nKey: 'common:systemTheme', fallback: 'System', icon: Monitor },
] as const satisfies ReadonlyArray<{
  value: ThemeMode;
  i18nKey: string;
  fallback: string;
  icon: typeof Sun | typeof Moon | typeof Monitor;
}>;

export function ModeToggle(props: { className?: string }) {
  const { setMode, mode, resolvedMode } = useAppTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const Items = useMemo(() => {
    return THEMES.map((item) => {
      const isSelected = mode === item.value;
      const ItemIcon = item.icon;

      return (
        <DropdownMenuItem
          className={cn('space-x-2', {
            'bg-muted': isSelected,
          })}
          key={item.value}
          onClick={() => setMode(item.value)}
        >
          <ItemIcon className="h-4 w-4" />

          <span>
            <Trans i18nKey={item.i18nKey} defaults={item.fallback} />
          </span>
        </DropdownMenuItem>
      );
    });
  }, [setMode, mode]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={props.className} disabled>
        <Sun className="h-[0.9rem] w-[0.9rem]" />
      </Button>
    );
  }

  // Icon based on the resolved (effective) theme
  const CurrentIcon = resolvedMode === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={props.className}>
          <CurrentIcon className="h-[0.9rem] w-[0.9rem]" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">{Items}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SubMenuModeToggle() {
  const { setMode, mode, resolvedMode } = useAppTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const MenuItems = useMemo(
    () =>
      THEMES.map((item) => {
        const isSelected = mode === item.value;
        const ItemIcon = item.icon;

        return (
          <DropdownMenuItem
            className={cn('flex cursor-pointer items-center space-x-2', {
              'bg-muted': isSelected,
            })}
            key={item.value}
            onClick={() => setMode(item.value)}
          >
            <ItemIcon className="h-4 w-4" />

            <span>
              <Trans i18nKey={item.i18nKey} defaults={item.fallback} />
            </span>
          </DropdownMenuItem>
        );
      }),
    [setMode, mode],
  );

  if (!mounted) {
    return null;
  }

  const CurrentIcon = resolvedMode === "dark" ? Moon : Sun;

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          className={
            'hidden w-full items-center justify-between gap-x-3 lg:flex'
          }
        >
          <span className={'flex space-x-2'}>
            <CurrentIcon className="h-4 w-4" />

            <span>
              <Trans i18nKey={'common:theme'} />
            </span>
          </span>
        </DropdownMenuSubTrigger>

        <DropdownMenuSubContent>{MenuItems}</DropdownMenuSubContent>
      </DropdownMenuSub>

      <div className={'lg:hidden'}>
        <DropdownMenuLabel>
          <Trans i18nKey={'common:theme'} />
        </DropdownMenuLabel>

        {MenuItems}
      </div>
    </>
  );
}
