import { SitePageHeader } from '@/components/marketing/site-page-header';

export const metadata = {
  title: 'Cookie Policy',
};

export default function CookiePolicyPage() {
  return (
    <div>
      <SitePageHeader
        title="Cookie Policy"
        subtitle="Last updated: December 2024"
      />

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="prose dark:prose-invert max-w-none">
          <p>Your cookie policy content goes here.</p>
          <h3>1. What are cookies?</h3>
          <p>Cookies are small text files that are used to store small pieces of information.</p>
          {/* Add more content as needed */}
        </div>
      </div>
    </div>
  );
}
