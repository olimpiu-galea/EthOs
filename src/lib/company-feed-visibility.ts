import type { CompanyFeedConfig } from "@/lib/company-features";
import type { SignalSource } from "@/lib/types";

export function isCompanyFeedAvailable(
  feed: SignalSource,
  opts: { companyFeeds: CompanyFeedConfig; phrase2Enabled: boolean },
): boolean {
  if (!opts.companyFeeds[feed]) return false;
  if ((feed === "commodity" || feed === "inventory") && !opts.phrase2Enabled) {
    return false;
  }
  return true;
}

export function anyCompanyFeedEnabled(
  companyFeeds: CompanyFeedConfig,
  phrase2Enabled: boolean,
): boolean {
  return (Object.keys(companyFeeds) as SignalSource[]).some((feed) =>
    isCompanyFeedAvailable(feed, { companyFeeds, phrase2Enabled }),
  );
}
