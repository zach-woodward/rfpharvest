// SEO topic taxonomy. Each topic generates an indexable page at
// /rfps/topic/<slug>, tuned for long-tail search ("hvac rfps",
// "paving bids", "engineering government contracts").
//
// Keyword matching is intentionally loose — we search title +
// description + category ILIKE each pattern. False positives are
// fine (more hits = more on-topic content), false negatives are
// worse (missing a relevant bid).

export interface Topic {
  slug: string;
  name: string; // H1 + title
  plural: string; // used in "<plural> RFPs"
  metaDescription: string;
  intro: string;
  keywords: string[]; // case-insensitive substrings; any match qualifies
  synonyms?: string[]; // additional terms surfaced in copy but not for matching
}

export const TOPICS: Topic[] = [
  {
    slug: "construction",
    name: "Construction",
    plural: "Construction",
    metaDescription:
      "Current construction RFPs and bid opportunities from U.S. municipalities. Filter by deadline and state. Updated every 6 hours.",
    intro:
      "Construction-related bid opportunities from municipal governments — building projects, renovations, demolitions, site work, and general contracting. Every bid is scraped directly from the town's website, deduplicated, and shown with the original source link.",
    keywords: ["construction", "renovation", "renovations", "build-out", "demolition", "general contractor"],
  },
  {
    slug: "paving",
    name: "Paving & Road Work",
    plural: "Paving",
    metaDescription:
      "Paving, milling, and road construction RFPs from towns and cities. Find active bids for asphalt, sealcoating, striping, and pavement overlay.",
    intro:
      "Paving and road construction contracts posted by municipalities — asphalt placement, milling, overlay, sealcoating, crack sealing, line striping, and pavement preservation programs.",
    keywords: ["paving", "pavement", "milling", "asphalt", "sealcoat", "striping", "overlay", "road construction"],
  },
  {
    slug: "hvac",
    name: "HVAC",
    plural: "HVAC",
    metaDescription:
      "HVAC RFPs, RFQs, and service contracts from U.S. municipalities. Heating, ventilation, air conditioning, and mechanical systems — all open bids in one place.",
    intro:
      "Heating, ventilation, and air conditioning work posted by municipal governments — system installation, replacement, service contracts, boilers, rooftop units, chillers, and mechanical maintenance.",
    keywords: ["hvac", "heating", "ventilation", "air conditioning", "boiler", "chiller", "mechanical system"],
  },
  {
    slug: "engineering",
    name: "Engineering Services",
    plural: "Engineering",
    metaDescription:
      "Engineering services RFPs — civil, structural, mechanical, electrical, and environmental. Municipal engineering opportunities, updated continuously.",
    intro:
      "Professional engineering services contracts from city and town governments — civil, structural, mechanical, electrical, environmental, and traffic engineering studies, designs, and on-call retainers.",
    keywords: ["engineering", "engineer", "civil", "structural", "geotechnical", "traffic study", "design services"],
  },
  {
    slug: "architecture",
    name: "Architecture & Design",
    plural: "Architecture",
    metaDescription:
      "Architectural design RFPs from U.S. municipalities. Schematic design, construction documents, master plans, and facility design contracts.",
    intro:
      "Architecture and design contracts from municipalities — schematic design, construction documents, master planning, feasibility studies, and facility renovations.",
    keywords: ["architect", "architectural", "master plan", "schematic design", "facility design"],
  },
  {
    slug: "it-services",
    name: "IT & Software Services",
    plural: "IT",
    metaDescription:
      "IT services and software RFPs from government agencies. Software implementations, managed services, cybersecurity, data, and cloud contracts.",
    intro:
      "Technology, software, and IT services contracts from municipalities — software implementations, managed IT, cybersecurity, network infrastructure, data and integration projects.",
    keywords: ["software", "it services", "managed services", "cybersecurity", "network", "cloud", "saas", "data migration", "gis software"],
  },
  {
    slug: "legal",
    name: "Legal Services",
    plural: "Legal",
    metaDescription:
      "Municipal legal counsel RFPs and professional services contracts. City attorney, labor counsel, prosecution services, and specialized legal opportunities.",
    intro:
      "Legal services contracts posted by municipal governments — city attorney retainers, labor counsel, prosecution, tax, bond, and specialized legal support.",
    keywords: ["legal counsel", "legal services", "attorney", "city solicitor", "prosecution", "labor counsel", "bond counsel"],
  },
  {
    slug: "landscaping",
    name: "Landscaping & Grounds",
    plural: "Landscaping",
    metaDescription:
      "Landscaping, mowing, tree work, and grounds maintenance RFPs from U.S. municipalities. Annual contracts and one-off projects.",
    intro:
      "Landscaping and grounds maintenance contracts from cities and towns — mowing, tree pruning, arboriculture, athletic field maintenance, and cemetery care.",
    keywords: ["landscap", "mowing", "grounds maintenance", "tree removal", "arborist", "athletic field"],
  },
  {
    slug: "janitorial",
    name: "Janitorial & Cleaning",
    plural: "Janitorial",
    metaDescription:
      "Janitorial services RFPs from municipalities and school districts. Office cleaning, school custodial, specialty cleaning contracts.",
    intro:
      "Janitorial and cleaning service contracts from city buildings, schools, and public facilities — routine custodial, specialty cleaning, and on-call services.",
    keywords: ["janitorial", "cleaning services", "custodial", "custodian"],
  },
  {
    slug: "snow-removal",
    name: "Snow Removal",
    plural: "Snow Removal",
    metaDescription:
      "Snow plowing and ice control RFPs from New England municipalities. Seasonal contracts for plowing, sanding, and winter maintenance.",
    intro:
      "Winter weather response contracts — snow plowing, sanding, salting, de-icing, and seasonal on-call services. Most contracts run Oct–April.",
    keywords: ["snow plow", "snow removal", "snow plowing", "de-icing", "sanding", "winter maintenance", "ice control"],
  },
  {
    slug: "waste-management",
    name: "Waste & Recycling",
    plural: "Waste Management",
    metaDescription:
      "Solid waste, recycling, and transfer station RFPs from U.S. municipalities. Curbside pickup, disposal, and hauling contracts.",
    intro:
      "Solid waste collection, recycling, hauling, and transfer station operations contracts from municipal governments.",
    keywords: ["solid waste", "recycling", "trash", "refuse", "hauling", "transfer station", "curbside collection"],
  },
  {
    slug: "water-sewer",
    name: "Water & Wastewater",
    plural: "Water & Wastewater",
    metaDescription:
      "Water main, sewer, and wastewater treatment RFPs from municipalities. Plant improvements, utility work, and water/sewer services.",
    intro:
      "Water and wastewater contracts — main replacement, sewer collection, treatment plant improvements, pump stations, and utility services.",
    keywords: ["water main", "sewer", "wastewater", "wwtp", "water treatment", "sanitary sewer", "pump station", "utility improvements"],
  },
  {
    slug: "vehicles-equipment",
    name: "Vehicles & Equipment",
    plural: "Vehicles",
    metaDescription:
      "Municipal vehicle and equipment RFPs. Fire trucks, plow trucks, loaders, cargo trailers, and specialty equipment bids.",
    intro:
      "Vehicle and equipment purchase bids — fire apparatus, plow trucks, loaders, dump trucks, mowers, cargo trailers, and specialty public-works equipment.",
    keywords: ["trailer", "truck", "loader", "fire apparatus", "plow", "dump truck", "equipment purchase"],
  },
  {
    slug: "security",
    name: "Security & Surveillance",
    plural: "Security",
    metaDescription:
      "Security services RFPs from U.S. municipalities — guard services, surveillance, access control, and safety contracts.",
    intro:
      "Security services contracts from city buildings, schools, and public facilities — guard services, CCTV, access control, and alarm monitoring.",
    keywords: ["security services", "surveillance", "cctv", "access control", "guard service", "alarm monitoring"],
  },
  {
    slug: "consulting",
    name: "Consulting",
    plural: "Consulting",
    metaDescription:
      "Professional consulting RFPs from municipalities — planning, policy, feasibility studies, and specialized advisory contracts.",
    intro:
      "Professional consulting contracts from municipalities — planning, policy studies, feasibility analyses, needs assessments, and specialized advisory work.",
    keywords: ["consulting", "consultant", "advisory", "feasibility study", "needs assessment", "policy study"],
  },
];

export function topicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}
