import type { ViewTotal } from '../lib/homepage';

// No owner-approved engagement definition or data source exists.
// The legacy 30-day pageview helper is not an approved engagement policy.
// Leave disabled until metric, source, window, ties and duplicate handling are approved.
export const engagementApproved = false;
export const readership: { source: string; dailyViews: ViewTotal[] } | null = null;
