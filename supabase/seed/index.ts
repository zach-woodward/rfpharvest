import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NH_MUNICIPALITIES = [
  { name: "Concord", county: "Merrimack", scraper_type: "concord-nh", rfp_page_url: "https://www.concordnh.gov/bids" },
  { name: "Manchester", county: "Hillsborough", scraper_type: "generic", rfp_page_url: "https://www.manchesternh.gov/Departments/Purchasing/Bids-and-Proposals" },
  { name: "Nashua", county: "Hillsborough", scraper_type: "generic", rfp_page_url: "https://www.nashuanh.gov/bids.aspx" },
  { name: "Dover", county: "Strafford", scraper_type: "generic", rfp_page_url: "https://www.dover.nh.gov/government/city-operations/finance/purchasing/" },
  { name: "Rochester", county: "Strafford", scraper_type: "generic" },
  { name: "Keene", county: "Cheshire", scraper_type: "generic" },
  { name: "Portsmouth", county: "Rockingham", scraper_type: "generic" },
  { name: "Laconia", county: "Belknap", scraper_type: "generic" },
  { name: "Lebanon", county: "Grafton", scraper_type: "generic" },
  { name: "Claremont", county: "Sullivan", scraper_type: "generic" },
  { name: "Berlin", county: "Coos", scraper_type: "generic" },
  { name: "Hanover", county: "Grafton", scraper_type: "generic" },
  { name: "Exeter", county: "Rockingham", scraper_type: "generic" },
  { name: "Hampton", county: "Rockingham", scraper_type: "generic" },
  { name: "Derry", county: "Rockingham", scraper_type: "generic" },
  { name: "Londonderry", county: "Rockingham", scraper_type: "generic" },
  { name: "Hudson", county: "Hillsborough", scraper_type: "generic" },
  { name: "Merrimack", county: "Hillsborough", scraper_type: "generic" },
  { name: "Bedford", county: "Hillsborough", scraper_type: "generic" },
  { name: "Amherst", county: "Hillsborough", scraper_type: "generic" },
];

const MOCK_RFPS = [
  {
    title: "Municipal Building HVAC Replacement",
    description: "The City of Concord is seeking proposals for the replacement of the HVAC system in the main municipal building, including design, equipment, installation, and commissioning. The existing system is a 25-year-old rooftop unit that has reached end of life.",
    category: "Construction",
    status: "open",
    posted_date: "2025-01-15",
    deadline_date: "2025-02-28T16:00:00Z",
    pre_bid_date: "2025-02-10T10:00:00Z",
    source_url: "https://www.concordnh.gov/bids/hvac-replacement-2025",
    contact_name: "Sarah Mitchell",
    contact_email: "smitchell@concordnh.gov",
    contact_phone: "603-225-8500",
    estimated_value: "$500,000 - $750,000",
    ai_summary: "The City of Concord seeks HVAC replacement for the municipal building. Scope includes full system design, procurement of equipment, installation, and commissioning. The current system is 25 years old. Estimated budget range is $500K-$750K. Pre-bid meeting scheduled for February 10. Licensed mechanical contractors with municipal experience should consider bidding. Prevailing wage requirements apply.",
  },
  {
    title: "IT Infrastructure Modernization - Phase 2",
    description: "Manchester seeks qualified vendors to modernize its IT infrastructure including network switches, server room upgrades, firewall implementation, and migration to hybrid cloud environment. Must include 3-year maintenance agreement.",
    category: "IT & Technology",
    status: "open",
    posted_date: "2025-01-20",
    deadline_date: "2025-03-15T14:00:00Z",
    qa_deadline: "2025-02-20T17:00:00Z",
    source_url: "https://www.manchesternh.gov/purchasing/it-modernization-phase2",
    contact_name: "James Rodriguez",
    contact_email: "jrodriguez@manchesternh.gov",
    estimated_value: "$1,200,000 - $1,800,000",
  },
  {
    title: "Annual Road Paving Program 2025",
    description: "The City of Nashua is soliciting bids for the 2025 Annual Road Paving Program covering approximately 15 miles of roadway resurfacing, including milling, paving, line striping, and ADA ramp upgrades.",
    category: "Construction",
    status: "open",
    posted_date: "2025-01-10",
    deadline_date: "2025-02-15T12:00:00Z",
    source_url: "https://www.nashuanh.gov/bids/paving-2025",
    contact_name: "Tom Burke",
    contact_email: "tburke@nashuanh.gov",
    estimated_value: "$2,000,000+",
  },
  {
    title: "Comprehensive Financial Audit Services",
    description: "The Town of Exeter seeks proposals from qualified CPA firms to perform annual comprehensive financial audits for fiscal years 2025-2027, including single audit if applicable.",
    category: "Financial",
    status: "open",
    posted_date: "2025-01-22",
    deadline_date: "2025-03-01T15:00:00Z",
    source_url: "https://www.exeternh.gov/rfp/financial-audit",
    contact_email: "finance@exeternh.gov",
  },
  {
    title: "Water Treatment Plant Upgrades",
    description: "Dover Water Works seeks engineering design and construction management services for upgrades to the Pudding Hill Water Treatment Plant including filter media replacement, chemical feed system upgrades, and SCADA integration.",
    category: "Engineering",
    status: "open",
    posted_date: "2025-01-18",
    deadline_date: "2025-03-10T16:00:00Z",
    pre_bid_date: "2025-02-15T09:00:00Z",
    source_url: "https://www.dover.nh.gov/rfp/water-treatment-2025",
    contact_name: "Karen Phillips",
    contact_email: "kphillips@dover.nh.gov",
    contact_phone: "603-516-6000",
    estimated_value: "$3,000,000 - $5,000,000",
  },
  {
    title: "Legal Services - Labor and Employment",
    description: "The City of Keene seeks proposals from qualified law firms to provide labor and employment legal counsel including contract negotiations, grievance arbitrations, and PELRB proceedings.",
    category: "Legal",
    status: "open",
    posted_date: "2025-01-25",
    deadline_date: "2025-02-28T17:00:00Z",
    contact_email: "legal@ci.keene.nh.us",
  },
  {
    title: "Downtown Streetscape Improvement Design",
    description: "Portsmouth seeks landscape architecture and urban design services for a downtown streetscape improvement project along Congress Street, including sidewalk widening, lighting, street furniture, and green infrastructure.",
    category: "Engineering",
    status: "open",
    posted_date: "2025-01-12",
    deadline_date: "2025-02-20T14:00:00Z",
    source_url: "https://www.cityofportsmouth.com/rfp/streetscape-2025",
    estimated_value: "$150,000 - $300,000",
  },
  {
    title: "School District Janitorial Services",
    description: "Laconia School District seeks proposals for janitorial and custodial services for 5 school buildings totaling approximately 250,000 sq ft. Three-year contract with two optional renewal years.",
    category: "Maintenance",
    status: "open",
    posted_date: "2025-01-28",
    deadline_date: "2025-03-05T12:00:00Z",
    contact_name: "Michael Chen",
    contact_email: "mchen@laconiaschools.org",
  },
  {
    title: "Emergency Communications System Upgrade",
    description: "Hillsborough County seeks proposals for a county-wide emergency radio communications system upgrade including P25 digital infrastructure, portable and mobile radios, and dispatch console equipment.",
    category: "Public Safety",
    status: "open",
    posted_date: "2025-01-08",
    deadline_date: "2025-03-20T16:00:00Z",
    pre_bid_date: "2025-02-12T13:00:00Z",
    qa_deadline: "2025-02-25T17:00:00Z",
    estimated_value: "$8,000,000 - $12,000,000",
  },
  {
    title: "Environmental Site Assessment - Former Mill Property",
    description: "The City of Berlin requests proposals for Phase I and Phase II Environmental Site Assessments of the former Brown Paper Company mill property, approximately 45 acres along the Androscoggin River.",
    category: "Environmental",
    status: "open",
    posted_date: "2025-01-30",
    deadline_date: "2025-03-15T16:00:00Z",
    contact_email: "planning@berlinnh.gov",
    estimated_value: "$75,000 - $150,000",
  },
  {
    title: "Transit Bus Replacement (3 Vehicles)",
    description: "Advance Transit seeks bids for three (3) new low-floor transit buses, 35-foot length, diesel or CNG, compliant with ADA and FTA Buy America requirements.",
    category: "Transportation",
    status: "closed",
    posted_date: "2024-11-15",
    deadline_date: "2025-01-10T14:00:00Z",
  },
  {
    title: "GIS Mapping Services",
    description: "Town of Londonderry seeks proposals for GIS mapping services including parcel data maintenance, web map application development, and aerial imagery acquisition.",
    category: "IT & Technology",
    status: "awarded",
    posted_date: "2024-10-01",
    deadline_date: "2024-11-15T16:00:00Z",
  },
];

async function seed() {
  console.log("Seeding municipalities...");

  // Insert municipalities
  for (const muni of NH_MUNICIPALITIES) {
    const { error } = await supabase.from("municipalities").insert({
      name: muni.name,
      state: "NH",
      county: muni.county,
      scraper_type: muni.scraper_type,
      rfp_page_url: muni.rfp_page_url || null,
      active: true,
    });
    if (error) console.error(`Error inserting ${muni.name}:`, error.message);
  }

  // Get inserted municipalities for FK references
  const { data: munis } = await supabase.from("municipalities").select("id, name");
  const muniMap = new Map(munis?.map((m) => [m.name, m.id]) || []);

  console.log("Seeding RFPs...");

  const muniNames = ["Concord", "Manchester", "Nashua", "Exeter", "Dover", "Keene", "Portsmouth", "Laconia", "Manchester", "Berlin", "Hanover", "Londonderry"];

  for (let i = 0; i < MOCK_RFPS.length; i++) {
    const rfp = MOCK_RFPS[i];
    const muniName = muniNames[i % muniNames.length];
    const muniId = muniMap.get(muniName);

    if (!muniId) {
      console.warn(`Municipality not found: ${muniName}`);
      continue;
    }

    const { error } = await supabase.from("rfps").insert({
      municipality_id: muniId,
      ...rfp,
      document_urls: [],
      raw_data: {},
    });
    if (error) console.error(`Error inserting RFP "${rfp.title}":`, error.message);
  }

  console.log("Seed complete.");
}

seed().catch(console.error);
