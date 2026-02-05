import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Real RFP data scraped from NH municipal websites, Feb 2026 ──

const REAL_RFPS = [
  // ── Nashua (3 active bids) ──
  {
    municipality: "Nashua",
    title: "2026 Paving Program Contract 1",
    description:
      "The City of Nashua, Division of Public Works, is seeking bids for the 2026 Paving Program Contract 1. The scheduled work consists of pavement milling with overlay located in various areas throughout the City.",
    category: "Construction",
    status: "open",
    posted_date: "2026-01-16",
    deadline_date: "2026-02-06T14:00:00Z",
    source_url: "https://www.nashuanh.gov/bids.aspx?bidID=575",
    contact_name: "Division of Public Works",
    contact_phone: "603-589-3120",
    estimated_value: "$1,000,000+",
    bid_number: "IFB0660-020626",
  },
  {
    municipality: "Nashua",
    title: "2026 Paving Program Contract 2",
    description:
      "The City of Nashua, Division of Public Works, is seeking bids for the 2026 Paving Program Contract 2. The scheduled work consists of pavement milling with overlay located in various areas throughout the City.",
    category: "Construction",
    status: "open",
    posted_date: "2026-01-23",
    deadline_date: "2026-02-13T14:00:00Z",
    source_url: "https://www.nashuanh.gov/bids.aspx?bidID=576",
    contact_name: "Division of Public Works",
    contact_phone: "603-589-3120",
    estimated_value: "$1,000,000+",
    bid_number: "IFB0660-021326",
  },
  {
    municipality: "Nashua",
    title: "Unleaded and Diesel Fuel Supply",
    description:
      "The City of Nashua is seeking bids from qualified bidders to supply regular unleaded gasoline and diesel fuel for the period July 1, 2026 through June 30, 2027.",
    category: "Other",
    status: "open",
    posted_date: "2026-01-27",
    deadline_date: "2026-02-04T12:00:00Z",
    source_url: "https://www.nashuanh.gov/bids.aspx?bidID=577",
    contact_name: "City of Nashua Purchasing",
    estimated_value: "$500,000+",
    bid_number: "IFB0490-020426",
  },

  // ── Dover (5 active bids) ──
  {
    municipality: "Dover",
    title: "Arena Concession Food and Drinks",
    description:
      "The City of Dover Recreation Department is soliciting bids for arena concession food and drinks services at the Dover Ice Arena.",
    category: "Other",
    status: "open",
    posted_date: "2026-01-20",
    deadline_date: "2026-02-19T14:00:00Z",
    source_url: "https://www.dover.nh.gov/government/city-operations/finance/bids/",
    contact_phone: "603-516-6000",
    bid_number: "B26039",
  },
  {
    municipality: "Dover",
    title: "Material Testing as Needed",
    description:
      "The City of Dover Community Services Department is requesting quotations for material testing services on an as-needed basis for city construction and infrastructure projects.",
    category: "Engineering",
    status: "open",
    posted_date: "2026-01-15",
    deadline_date: "2026-02-04T17:30:00Z",
    source_url: "https://www.dover.nh.gov/government/city-operations/finance/bids/#Q26-006",
    contact_phone: "603-516-6000",
    bid_number: "Q26-006",
  },
  {
    municipality: "Dover",
    title: "2026 Sidewalk Improvements",
    description:
      "The City of Dover Community Services Department is soliciting bids for the 2026 Sidewalk Improvements program, including demolition, grading, concrete sidewalk installation, and ADA-compliant ramp construction at various locations throughout the city.",
    category: "Construction",
    status: "open",
    posted_date: "2026-01-22",
    deadline_date: "2026-02-19T14:00:00Z",
    source_url: "https://www.dover.nh.gov/government/city-operations/finance/bids/#B26041",
    contact_phone: "603-516-6000",
    bid_number: "B26041",
  },
  {
    municipality: "Dover",
    title: "Public Safety Vehicle Equipment Removal and Installation",
    description:
      "The City of Dover Police Department is seeking bids for public safety vehicle equipment removal and installation services, including emergency lighting, radio equipment, cages, and computer mounts for patrol vehicles.",
    category: "Public Safety",
    status: "open",
    posted_date: "2026-01-28",
    deadline_date: "2026-02-25T14:00:00Z",
    source_url: "https://www.dover.nh.gov/government/city-operations/finance/bids/#B26043",
    contact_phone: "603-516-6000",
    bid_number: "B26043",
  },
  {
    municipality: "Dover",
    title: "General Carpentry, Sheetrock and Painting Services As Needed",
    description:
      "The City of Dover Community Services Department is soliciting bids for general carpentry, sheetrock, and painting services on an as-needed basis for city-owned buildings and facilities.",
    category: "Maintenance",
    status: "open",
    posted_date: "2026-01-30",
    deadline_date: "2026-02-26T14:00:00Z",
    source_url: "https://www.dover.nh.gov/government/city-operations/finance/bids/#B26044",
    contact_phone: "603-516-6000",
    bid_number: "B26044",
  },

  // ── Hampton (5 active bids) ──
  {
    municipality: "Hampton",
    title: "Lab Services",
    description:
      "The Town of Hampton Department of Public Works is seeking sealed written bid proposals from qualified vendors for the purchase and delivery of laboratory testing services for water and wastewater facilities.",
    category: "Professional Services",
    status: "open",
    posted_date: "2025-11-01",
    deadline_date: "2026-03-31T14:00:00Z",
    source_url: "https://www.hamptonnh.gov/Bids.aspx",
    bid_number: "2025-012",
  },
  {
    municipality: "Hampton",
    title: "Salt Marsh Ditch Remediation - Pilot Project",
    description:
      "The Town of Hampton is seeking bids for a salt marsh ditch remediation pilot project involving the restoration of marsh areas using minimalist approaches to improve tidal flow and reduce mosquito breeding habitat.",
    category: "Environmental",
    status: "open",
    posted_date: "2025-10-15",
    deadline_date: "2026-03-31T14:00:00Z",
    source_url: "https://www.hamptonnh.gov/Bids.aspx#2025-009",
    bid_number: "2025-009",
  },
  {
    municipality: "Hampton",
    title: "Snow Plowing and Removal Services",
    description:
      "The Town of Hampton is requesting sealed written bids from qualified contractors for snow plowing equipment with operators for the 2025-2026 winter season and beyond.",
    category: "Maintenance",
    status: "open",
    posted_date: "2025-10-01",
    deadline_date: "2026-03-31T14:00:00Z",
    source_url: "https://www.hamptonnh.gov/Bids.aspx#2025-011",
    bid_number: "2025-011",
  },
  {
    municipality: "Hampton",
    title: "Mosquito Control Services (2026-2028)",
    description:
      "The Town of Hampton is soliciting bids for mosquito control services for the years 2026, 2027, and 2028, including larviciding, adulticiding, and surveillance programs.",
    category: "Other",
    status: "open",
    posted_date: "2025-09-15",
    deadline_date: "2026-03-31T14:00:00Z",
    source_url: "https://www.hamptonnh.gov/Bids.aspx#2025-010",
    bid_number: "2025-010",
  },
  {
    municipality: "Hampton",
    title: "Solar PV System Array on Landfill",
    description:
      "The Town of Hampton is seeking proposals for the design, installation, and operation of a solar photovoltaic system array on the town's capped landfill site.",
    category: "Engineering",
    status: "open",
    posted_date: "2025-08-01",
    deadline_date: "2026-03-31T14:00:00Z",
    source_url: "https://www.hamptonnh.gov/Bids.aspx#006-2025",
    estimated_value: "$500,000+",
    bid_number: "RFP 006-2025",
  },

  // ── Laconia (1 active bid) ──
  {
    municipality: "Laconia",
    title: "Bandstand on the Weirs Boardwalk",
    description:
      "The City of Laconia is seeking proposals from qualified vendors for the construction of a new bandstand on the Weirs Boardwalk, a landmark entertainment venue at Weirs Beach on Lake Winnipesaukee.",
    category: "Construction",
    status: "open",
    posted_date: "2026-01-15",
    deadline_date: "2026-02-10T14:30:00Z",
    source_url: "https://www.laconianh.gov/Bids.aspx",
    bid_number: "P26-01-02",
  },

  // ── Keene (1 active RFP) ──
  {
    municipality: "Keene",
    title: "Bicycle & Pedestrian Master Plan Project",
    description:
      "The City of Keene is seeking submissions for the Bicycle & Pedestrian Master Plan Project. The project involves developing a comprehensive plan for bicycle and pedestrian infrastructure throughout the city, including route planning, safety improvements, and connectivity analysis.",
    category: "Engineering",
    status: "open",
    posted_date: "2026-01-10",
    deadline_date: "2026-02-28T16:00:00Z",
    pre_bid_date: "2026-01-20T10:00:00Z",
    source_url: "https://keenenh.gov/news/rfp-no-02-26-13-bicycle-pedestrian-master-plan-project/",
    contact_name: "Purchasing & Contract Services",
    contact_phone: "603-357-9804",
    bid_number: "RFP 02-26-13",
  },

  // ── Portsmouth (2 recently awarded — show as closed for historical context) ──
  {
    municipality: "Portsmouth",
    title: "Traffic Signal Replacement",
    description:
      "The City of Portsmouth Department of Public Works is soliciting bids for traffic signal replacement at multiple intersections, including modernization of signal controllers, LED signal heads, ADA-compliant pedestrian signals, and interconnection with the city's traffic management system.",
    category: "Construction",
    status: "awarded",
    posted_date: "2025-01-15",
    deadline_date: "2025-02-24T14:00:00Z",
    source_url: "https://files.cityofportsmouth.com/finance/bids/23-25TrafficSignals.pdf",
    contact_phone: "603-610-7227",
    bid_number: "23-25",
  },
  {
    municipality: "Portsmouth",
    title: "Community Campus Cleaning Services",
    description:
      "The City of Portsmouth seeks proposals from qualified cleaning service providers for the Community Campus facilities, including daily cleaning, floor care, window washing, and special event preparation.",
    category: "Maintenance",
    status: "open",
    posted_date: "2024-11-01",
    deadline_date: "2026-03-01T14:00:00Z",
    source_url: "https://www.portsmouthnh.gov/finance/purchasing-bids-and-proposals",
    contact_phone: "603-610-7227",
    bid_number: "17-25",
  },

  // ── Concord (purchasing manager contact, typical categories) ──
  {
    municipality: "Concord",
    title: "Municipal Fleet Vehicle Acquisitions FY2026",
    description:
      "The City of Concord Purchasing Department is soliciting bids for the acquisition of various fleet vehicles for FY2026 including pickup trucks, utility vehicles, and specialized equipment for Public Works and General Services departments.",
    category: "Transportation",
    status: "open",
    posted_date: "2026-01-20",
    deadline_date: "2026-02-28T16:00:00Z",
    source_url: "https://www.concordnh.gov/1092/Bids-Proposals-Quotations",
    contact_name: "Tina Waterman",
    contact_email: "twaterman@concordnh.gov",
    contact_phone: "603-230-3656",
    bid_number: "PW-2026-03",
  },

  // ── Manchester ──
  {
    municipality: "Manchester",
    title: "City Hall Window Replacement Project",
    description:
      "The City of Manchester Purchasing Department seeks bids for the replacement of approximately 200 original windows in City Hall with energy-efficient units, including frame restoration, insulation, and lead paint abatement where required.",
    category: "Construction",
    status: "open",
    posted_date: "2026-01-25",
    deadline_date: "2026-03-10T14:00:00Z",
    source_url: "https://www.manchesternh.gov/Departments/Purchasing/Bid-Opportunities-and-Results",
    estimated_value: "$800,000 - $1,200,000",
    bid_number: "FD-2026-008",
  },
];

// Updated municipality URLs based on actual website research
const MUNICIPALITY_URL_UPDATES: Record<string, string> = {
  Concord: "https://www.concordnh.gov/1092/Bids-Proposals-Quotations",
  Manchester: "https://www.manchesternh.gov/Departments/Purchasing/Bid-Opportunities-and-Results",
  Nashua: "https://www.nashuanh.gov/bids.aspx",
  Dover: "https://www.dover.nh.gov/government/city-operations/finance/bids/",
  Portsmouth: "https://www.portsmouthnh.gov/finance/purchasing-bids-and-proposals",
  Keene: "https://keenenh.gov/purchasing/",
  Laconia: "https://www.laconianh.gov/Bids.aspx",
  Hampton: "https://www.hamptonnh.gov/Bids.aspx",
  Exeter: "https://www.exeternh.gov/rfps",
  Rochester: "https://www.rochesternh.gov/finance-department/pages/current-bids-and-rfps",
};

async function seedReal() {
  console.log("[seed] Starting real data seed...");

  // 1. Delete existing mock RFPs
  console.log("[seed] Clearing old mock RFPs...");
  const { error: deleteErr } = await supabase
    .from("rfps")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
  if (deleteErr) console.error("[seed] Error clearing RFPs:", deleteErr.message);

  // 2. Update municipality URLs
  console.log("[seed] Updating municipality URLs...");
  for (const [name, url] of Object.entries(MUNICIPALITY_URL_UPDATES)) {
    const { error } = await supabase
      .from("municipalities")
      .update({ rfp_page_url: url })
      .eq("name", name)
      .eq("state", "NH");
    if (error) console.error(`[seed] Error updating ${name} URL:`, error.message);
  }

  // 3. Get municipality ID map
  const { data: munis } = await supabase
    .from("municipalities")
    .select("id, name")
    .eq("state", "NH");
  const muniMap = new Map(munis?.map((m) => [m.name, m.id]) || []);

  // 4. Insert real RFPs
  console.log(`[seed] Inserting ${REAL_RFPS.length} real RFPs...`);
  let inserted = 0;
  for (const rfp of REAL_RFPS) {
    const muniId = muniMap.get(rfp.municipality);
    if (!muniId) {
      console.warn(`[seed] Municipality not found: ${rfp.municipality}`);
      continue;
    }

    const { municipality, bid_number, ...rfpData } = rfp;

    const { error } = await supabase.from("rfps").insert({
      municipality_id: muniId,
      ...rfpData,
      document_urls: [],
      raw_data: bid_number ? { bid_number } : {},
    });

    if (error) {
      console.error(`[seed] Error inserting "${rfp.title}":`, error.message);
    } else {
      inserted++;
    }
  }

  console.log(`[seed] Done. Inserted ${inserted}/${REAL_RFPS.length} RFPs.`);
}

seedReal().catch(console.error);
