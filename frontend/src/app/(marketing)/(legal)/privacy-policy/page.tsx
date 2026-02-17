import { SitePageHeader } from '@/components/marketing/site-page-header';

export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicyPage() {
  return (
    <div>
      <SitePageHeader
        title="Privacy Policy"
        subtitle="Last updated: December 2024"
      />

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="prose dark:prose-invert max-w-none">
          <p>Your privacy policy content goes here.</p>
          <h3>1. Introduction</h3>
          <p>We respect your privacy and are committed to protecting your personal data.</p>
          {/* Add more content as needed */}
        </div>
      </div>
    </div>
  );
}
