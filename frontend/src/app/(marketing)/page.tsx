import Hero from '@/components/marketing/Hero';
import Stats from '@/components/marketing/Stats';
import Testimonials from '@/components/marketing/Testimonials';
import Features from '@/components/marketing/Features';
import Process from '@/components/marketing/Process';
import CTA from '@/components/marketing/CTA';
import Pricing from '@/components/marketing/Pricing';

export default function Home() {
    return (
        <main className="space-y-0">
            <Hero />
            <Stats />
            <Testimonials />
            <Features />
            <Process />
            <CTA />
            <Pricing />
        </main>
    );
}
