"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@kit/ui/utils';
import GlassCard from './GlassCard';
import GradientText from './GradientText';

const testimonials = [
  {
    id: 1,
    content: "AutoSocialPosts has completely transformed our content strategy. We're now able to create and schedule a month's worth of social media content in just a few hours. The AI-generated posts are engaging and on-brand every time.",
    author: "Sarah Johnson",
    role: "Marketing Director, TechStart Inc.",
    avatar: "/images/testimonials/avatar-1.jpg"
  },
  {
    id: 2,
    content: "As a solo entrepreneur, I was struggling to maintain a consistent social media presence. AutoSocialPosts has been a game-changer - I just paste in my blog URLs and it creates perfect posts for each platform. My engagement has increased by 45% in just two months!",
    author: "Michael Chen",
    role: "Founder, Growth Mindset Blog",
    avatar: "/images/testimonials/avatar-2.jpg"
  },
  {
    id: 3,
    content: "Our agency manages social media for over 20 clients. AutoSocialPosts has cut our content creation time by 70% while improving the quality of our posts. The platform-specific formatting is spot on, and our clients are thrilled with the results.",
    author: "Jessica Martinez",
    role: "Social Media Manager, Pulse Agency",
    avatar: "/images/testimonials/avatar-3.jpg"
  },
  {
    id: 4,
    content: "I was skeptical about AI-generated content, but AutoSocialPosts has proven me wrong. The posts it creates are engaging, on-brand, and drive real results. It's like having an extra team member dedicated to social media.",
    author: "David Wilson",
    role: "Digital Marketing Lead, Retail Innovations",
    avatar: "/images/testimonials/avatar-4.jpg"
  },
  {
    id: 5,
    content: "The time savings alone make AutoSocialPosts worth every penny, but the increase in engagement we've seen is the real win. Our social media presence has never been stronger, and it takes a fraction of the effort it used to.",
    author: "Emma Thompson",
    role: "Content Creator, Lifestyle Collective",
    avatar: "/images/testimonials/avatar-5.jpg"
  }
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const testimonialsSectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target) {
            const elements = entry.target.querySelectorAll('.reveal');
            elements.forEach((el, i) => {
              if (el) {
                setTimeout(() => {
                  el.classList.add('active');
                }, i * 100);
              }
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (testimonialsSectionRef.current) {
      observer.observe(testimonialsSectionRef.current);
    }
    
    return () => {
      if (testimonialsSectionRef.current) {
        observer.unobserve(testimonialsSectionRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <section id="testimonials" className="py-20 relative" ref={testimonialsSectionRef}>
      <div className="section-container">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center mb-3 px-3 py-1 rounded-full bg-white/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-foreground">
            <span className="mr-2 size-2 rounded-full bg-brand-purple"></span>
            What Our Users Say
          </div>
          <h2 className="section-title reveal">
            Trusted by <GradientText>Content Creators</GradientText> Everywhere
          </h2>
          <p className="section-subtitle reveal" style={{ animationDelay: '0.1s' }}>
            See how AutoSocialPosts is helping businesses and creators save time and boost engagement.
          </p>
        </div>
        
        <div className="relative mt-16">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2 reveal" style={{ animationDelay: '0.2s' }}>
              <GlassCard className="p-8 h-full">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.33333 21.3333C7.86 21.3333 6.57333 20.8 5.46667 19.7333C4.36 18.6267 3.82667 17.34 3.82667 15.8667C3.82667 14.6667 4.12 13.4933 4.70667 12.3467C5.33333 11.2 6.16 10.1933 7.18667 9.32667C8.25333 8.42 9.45333 7.68 10.7867 7.10667C12.16 6.53333 13.5733 6.24 15.0267 6.22667L15.7333 9.06667C14.7467 9.16 13.7733 9.38667 12.8133 9.74667C11.8533 10.1067 10.9733 10.5733 10.1733 11.1467C9.37333 11.72 8.69333 12.3733 8.13333 13.1067C7.61333 13.84 7.30667 14.6267 7.21333 15.4667C7.58667 15.2267 8.02667 15.04 8.53333 14.9067C9.04 14.7733 9.54667 14.7067 10.0533 14.7067C11.3867 14.7067 12.5067 15.1467 13.4133 16.0267C14.32 16.9067 14.7733 18.0267 14.7733 19.3867C14.7733 20.7467 14.32 21.8667 13.4133 22.7467C12.5067 23.6267 11.0533 24.0667 9.33333 24.0667V21.3333ZM22.6667 21.3333C21.1933 21.3333 19.9067 20.8 18.8 19.7333C17.6933 18.6267 17.16 17.34 17.16 15.8667C17.16 14.6667 17.4533 13.4933 18.04 12.3467C18.6667 11.2 19.4933 10.1933 20.52 9.32667C21.5867 8.42 22.7867 7.68 24.12 7.10667C25.4933 6.53333 26.9067 6.24 28.36 6.22667L29.0667 9.06667C28.08 9.16 27.1067 9.38667 26.1467 9.74667C25.1867 10.1067 24.3067 10.5733 23.5067 11.1467C22.7067 11.72 22.0267 12.3733 21.4667 13.1067C20.9467 13.84 20.64 14.6267 20.5467 15.4667C20.92 15.2267 21.36 15.04 21.8667 14.9067C22.3733 14.7733 22.88 14.7067 23.3867 14.7067C24.72 14.7067 25.84 15.1467 26.7467 16.0267C27.6533 16.9067 28.1067 18.0267 28.1067 19.3867C28.1067 20.7467 27.6533 21.8667 26.7467 22.7467C25.84 23.6267 24.3867 24.0667 22.6667 24.0667V21.3333Z" fill="url(#paint0_linear_1204_1453)"/>
                      <defs>
                        <linearGradient id="paint0_linear_1204_1453" x1="3.82667" y1="15.1467" x2="29.0667" y2="15.1467" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#8B5CF6"/>
                          <stop offset="1" stopColor="#3B82F6"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  <p className="text-lg md:text-xl font-medium mb-8 flex-grow">
                    {testimonials[activeIndex]?.content}
                  </p>
                  
                  <div className="flex items-center">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-brand-purple/20">
                      <Image 
                        src={testimonials[activeIndex]?.avatar || ''} 
                        alt={testimonials[activeIndex]?.author || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold">{testimonials[activeIndex]?.author}</h4>
                      <p className="text-sm text-foreground/60">{testimonials[activeIndex]?.role}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
            
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-4 reveal" style={{ animationDelay: '0.3s' }}>
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.id}
                  className={cn(
                    "cursor-pointer transition-all duration-300 rounded-xl overflow-hidden border-2",
                    activeIndex === index 
                      ? "border-brand-purple scale-105 shadow-lg" 
                      : "border-transparent opacity-50 hover:opacity-80"
                  )}
                  onClick={() => setActiveIndex(index)}
                >
                  <div className="relative w-full aspect-square">
                    <Image 
                      src={testimonial.avatar} 
                      alt={testimonial.author}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center mt-8 space-x-2 reveal" style={{ animationDelay: '0.4s' }}>
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  activeIndex === index 
                    ? "bg-brand-purple" 
                    : "bg-foreground/20 hover:bg-foreground/40"
                )}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
