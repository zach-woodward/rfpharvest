import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "Browse all RFPs",
      "Basic search & filters",
      "View RFP details",
    ],
    limits: {
      alerts: 0,
      summaries: false,
      savedFilters: 0,
    },
  },
  pro: {
    name: "Pro",
    price: 29,
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    features: [
      "Everything in Free",
      "AI-powered RFP summaries",
      "Email alerts & daily digest",
      "Saved filters (up to 10)",
      "Priority support",
    ],
    limits: {
      alerts: 10,
      summaries: true,
      savedFilters: 10,
    },
  },
  enterprise: {
    name: "Enterprise",
    price: null, // Custom pricing
    features: [
      "Everything in Pro",
      "Unlimited saved filters",
      "Admin dashboard",
      "API access",
      "Custom scraper configs",
    ],
    limits: {
      alerts: Infinity,
      summaries: true,
      savedFilters: Infinity,
    },
  },
} as const;
