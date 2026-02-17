"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Button from './Button';
import { BrandLogo } from '@/components/brand-logo';
import { cn } from '@kit/ui/utils';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4',
        isScrolled
          ? 'bg-background/80 backdrop-blur-lg shadow-lg shadow-black/10'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <BrandLogo variant="horizontal" className="h-8 w-auto gap-2" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm text-foreground/80 hover:text-foreground transition-colors">Features</a>
            <a href="#process" className="text-sm text-foreground/80 hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-foreground/80 hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm text-foreground/80 hover:text-foreground transition-colors">Success Stories</a>
            <a href="#about" className="text-sm text-foreground/80 hover:text-foreground transition-colors">About</a>
          </nav>

          {/* CTA Buttons and Theme Toggle */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button size="sm">Sign Up</Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              className="text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'md:hidden absolute top-full left-0 right-0 bg-background/95 dark:bg-brand-dark/95 backdrop-blur-lg transition-all duration-300 ease-in-out border-t border-foreground/5 dark:border-white/5 overflow-hidden',
          isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 py-3 space-y-1">
          <a href="#features" className="block py-2 text-foreground/80 hover:text-foreground">Features</a>
          <a href="#process" className="block py-2 text-foreground/80 hover:text-foreground">How It Works</a>
          <a href="#pricing" className="block py-2 text-foreground/80 hover:text-foreground">Pricing</a>
          <a href="#testimonials" className="block py-2 text-foreground/80 hover:text-foreground">Success Stories</a>
          <a href="#about" className="block py-2 text-foreground/80 hover:text-foreground">About</a>
          <div className="pt-2 pb-3 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="w-full">Sign In</Button>
            <Button size="sm" className="w-full">Sign Up</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
