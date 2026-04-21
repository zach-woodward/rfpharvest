export type RfpStatus = "open" | "closed" | "awarded" | "canceled" | "unknown";
export type SubscriptionTier = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "inactive" | "past_due" | "canceled";
export type AlertFrequency = "instant" | "daily" | "weekly";
export type ScrapeStatus = "running" | "success" | "partial" | "error";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  stripe_customer_id: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface Municipality {
  id: string;
  name: string;
  state: string;
  county: string | null;
  website_url: string | null;
  rfp_page_url: string | null;
  scraper_type: string;
  scraper_config: Record<string, unknown>;
  active: boolean;
  last_scraped_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rfp {
  id: string;
  municipality_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: RfpStatus;
  posted_date: string | null;
  deadline_date: string | null;
  pre_bid_date: string | null;
  qa_deadline: string | null;
  source_url: string | null;
  document_urls: string[];
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  estimated_value: string | null;
  ai_summary: string | null;
  ai_summary_generated_at: string | null;
  requires_signup: boolean;
  bid_requirements: BidRequirement[];
  raw_data: Record<string, unknown>;
  scraped_at: string;
  created_at: string;
  updated_at: string;
  // Joined
  municipality?: Municipality;
}

export interface BidRequirement {
  label: string;
  details?: string;
}

export interface SavedRfp {
  id: string;
  user_id: string;
  rfp_id: string;
  saved_at: string;
}

export interface ScrapeLog {
  id: string;
  municipality_id: string | null;
  started_at: string;
  completed_at: string | null;
  status: ScrapeStatus;
  rfps_found: number;
  rfps_new: number;
  rfps_updated: number;
  error_message: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AlertFilters {
  categories?: string[];
  municipalities?: string[];
  states?: string[];
  keywords?: string[];
  status?: RfpStatus[];
}

export interface UserAlert {
  id: string;
  user_id: string;
  name: string;
  filters: AlertFilters;
  email_enabled: boolean;
  frequency: AlertFrequency;
  last_notified_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  user_id: string;
  alert_id: string | null;
  rfp_ids: string[];
  email_sent_at: string | null;
  email_status: "pending" | "sent" | "failed";
  created_at: string;
}

// Filter params for RFP queries
export interface RfpFilters {
  search?: string;
  categories?: string[];
  municipalities?: string[];
  status?: RfpStatus[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "posted_date" | "deadline_date";
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
}
