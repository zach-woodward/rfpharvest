export interface ScrapedRfp {
  title: string;
  description?: string;
  category?: string;
  status?: string;
  posted_date?: string;
  deadline_date?: string;
  pre_bid_date?: string;
  qa_deadline?: string;
  source_url?: string;
  document_urls?: string[];
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  estimated_value?: string;
  requires_signup?: boolean;
  raw_data?: Record<string, unknown>;
}

export interface ScraperConfig {
  rfp_page_url: string;
  selectors?: {
    listing_container?: string;
    listing_item?: string;
    title?: string;
    description?: string;
    deadline?: string;
    posted_date?: string;
    link?: string;
    category?: string;
    status?: string;
  };
  pagination?: {
    type: "page_param" | "next_button" | "none";
    param_name?: string;
    max_pages?: number;
    next_selector?: string;
  };
  requires_js?: boolean;
  custom_headers?: Record<string, string>;
}

export interface ScraperAdapter {
  name: string;
  scrape(config: ScraperConfig): Promise<ScrapedRfp[]>;
}
