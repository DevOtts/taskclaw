/**
 * Edition detection for TaskClaw.
 * Community edition: self-hosted, all features except billing/observability
 * Cloud edition: managed TaskClaw Cloud with billing and advanced AI observability
 */
export const isCloudEdition = process.env.NEXT_PUBLIC_EDITION === 'cloud';
export const isCommunityEdition = process.env.NEXT_PUBLIC_EDITION !== 'cloud';
