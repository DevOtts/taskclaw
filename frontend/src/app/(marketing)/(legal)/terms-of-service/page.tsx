import { SitePageHeader } from '@/components/marketing/site-page-header';

export const metadata = {
  title: 'Terms of Service',
};

export default function TermsOfServicePage() {
  return (
    <div>
      <SitePageHeader
        title="Terms of Service"
        subtitle="Last updated: December 2024"
      />

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="prose dark:prose-invert max-w-none">
          <p>Your terms of service content goes here.</p>
          <h3>1. Acceptance of Terms</h3>
          <p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p>
          {/* Add more content as needed */}
        </div>
      </div>
    </div>
  );
}
