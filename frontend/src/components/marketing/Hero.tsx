"use client";

import { ArrowRightIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import GradientText from './GradientText';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = hero.getBoundingClientRect();
      const x = (e.clientX - left) / width;
      const y = (e.clientY - top) / height;

      hero.style.setProperty('--x', `${x}`);
      hero.style.setProperty('--y', `${y}`);
    };

    hero.addEventListener('mousemove', handleMouseMove);

    return () => {
      hero.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={{ '--x': '0.5', '--y': '0.5' } as React.CSSProperties}
    >
      <div className="section-container text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center bg-foreground/5 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-foreground/10 opacity-0 animate-fade-in">
          <div className="h-2 w-2 rounded-full bg-orange-500 mr-2 animate-pulse"></div>
          <p className="text-sm font-medium text-foreground/80">
            Powered by{' '}
            <a
              href="https://openclaw.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 font-semibold hover:text-orange-400 transition-colors"
            >
              OpenClaw
            </a>
          </p>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 max-w-4xl mx-auto opacity-0 animate-fade-in-delay-1 text-foreground tracking-tight">
          Stop organizing tasks.
          <br />
          <GradientText>Start finishing them.</GradientText>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto mb-8 opacity-0 animate-fade-in-delay-2 leading-relaxed">
          The first task hub that doesn&apos;t just organize your work — it starts it for you.
          Sync Notion, ClickUp, and more into one board. Then let AI do the heavy lifting.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-delay-3">
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 py-3 px-8 bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-xl font-semibold text-base hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 transition-all"
          >
            Join the Waitlist
            <ArrowRightIcon className="h-4 w-4" />
          </a>
          <a
            href="#solution"
            className="inline-flex items-center gap-2 py-3 px-8 border border-foreground/20 text-foreground/80 rounded-xl font-medium text-base hover:bg-foreground/5 hover:text-foreground transition-all"
          >
            See how it works
          </a>
        </div>

        {/* Flow Visual */}
        <div className="flex items-center justify-center gap-3 mt-16 flex-wrap opacity-0 animate-fade-in-delay-3">
          <FlowNode icon="N" label="Notion" />
          <FlowArrow />
          <FlowNode icon="C" label="ClickUp" />
          <FlowArrow />
          <FlowNode icon="O" label="Onset" variant="onset" />
          <FlowArrow />
          <FlowNode icon="AI" label="OpenClaw" variant="claw" />
          <FlowArrow />
          <FlowNode icon="ok" label="Done" variant="done" />
        </div>
      </div>
    </section>
  );
};

function FlowNode({ icon, label, variant }: { icon: string; label: string; variant?: 'onset' | 'claw' | 'done' }) {
  const variantStyles = {
    onset: 'border-brand-purple/30 bg-brand-purple/10',
    claw: 'border-orange-500/30 bg-orange-500/10',
    done: 'border-green-500/30 bg-green-500/10',
  };

  const iconStyles = {
    onset: 'text-brand-purple',
    claw: 'text-orange-500',
    done: 'text-green-500',
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium backdrop-blur-sm ${variant ? variantStyles[variant] : 'border-foreground/10 bg-foreground/5'}`}>
      <span className={`font-mono text-xs font-bold ${variant ? iconStyles[variant] : 'text-foreground/60'}`}>{icon}</span>
      <span className="text-foreground/80">{label}</span>
    </div>
  );
}

function FlowArrow() {
  return <span className="text-foreground/30 text-lg hidden sm:block">&rarr;</span>;
}

export default Hero;
