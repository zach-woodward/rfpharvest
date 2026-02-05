import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enrich existing RFPs with AI summaries, bid requirements, document URLs
const ENRICHMENTS: Record<string, {
  ai_summary?: string;
  bid_requirements?: { label: string; details?: string }[];
  document_urls?: string[];
  estimated_value?: string;
}> = {
  "Municipal Building HVAC Replacement": {
    ai_summary: `Concord seeks full HVAC system replacement for the main municipal building. The existing 25-year-old rooftop unit has reached end of life.

Scope: Design, equipment procurement, installation, and commissioning of a new HVAC system. Work includes removal and disposal of existing equipment, ductwork modifications, controls integration, and commissioning/balancing.

Budget: $500,000 - $750,000 estimated. Prevailing wage requirements apply.

Timeline: Pre-bid meeting Feb 10, bids due Feb 28, anticipated start date April 2025, substantial completion by October 2025.

Who should bid: Licensed mechanical contractors with 5+ years of municipal/commercial HVAC experience. Must hold NH mechanical contractor license and provide performance bond.`,
    bid_requirements: [
      { label: "NH Mechanical Contractor License", details: "Current and in good standing" },
      { label: "General Liability Insurance", details: "Minimum $2,000,000 per occurrence" },
      { label: "Performance & Payment Bond", details: "100% of contract value" },
      { label: "Workers' Compensation Insurance", details: "As required by NH RSA 281-A" },
      { label: "5+ Years Commercial HVAC Experience", details: "Provide 3 comparable project references" },
      { label: "Prevailing Wage Compliance", details: "Per NH RSA 280" },
    ],
    document_urls: [
      "https://www.concordnh.gov/bids/hvac-replacement-2025/RFP-HVAC-2025.pdf",
      "https://www.concordnh.gov/bids/hvac-replacement-2025/Appendix-A-Building-Plans.pdf",
      "https://www.concordnh.gov/bids/hvac-replacement-2025/Appendix-B-Specifications.pdf",
    ],
  },
  "IT Infrastructure Modernization - Phase 2": {
    ai_summary: `Manchester is modernizing its IT infrastructure across city departments. This is Phase 2, building on network assessment completed in Phase 1.

Scope: Replace 120+ network switches (access and distribution layer), upgrade server room with new rack infrastructure and UPS, implement next-gen firewall cluster, and migrate 40% of workloads to hybrid cloud (Azure preferred).

Budget: $1.2M - $1.8M. Three-year maintenance agreement required as part of proposal.

Key requirements: Must support 10Gbps backbone, 802.1X network access control, and integrate with existing Active Directory. Cloud migration must maintain CJIS compliance for police department systems.

Who should bid: IT infrastructure firms with government/municipal experience, relevant Cisco or equivalent certifications, and Azure cloud competency.`,
    bid_requirements: [
      { label: "Relevant Manufacturer Certifications", details: "Cisco Gold Partner or equivalent preferred" },
      { label: "Azure Cloud Competency", details: "Microsoft Solutions Partner designation" },
      { label: "CJIS Compliance Experience", details: "Must demonstrate prior CJIS-compliant deployments" },
      { label: "Professional Liability Insurance", details: "Minimum $1,000,000" },
      { label: "3-Year Maintenance Agreement", details: "24/7 support with 4-hour response SLA" },
      { label: "Project Manager On-site", details: "Dedicated PM for duration of project" },
    ],
    document_urls: [
      "https://www.manchesternh.gov/purchasing/it-modernization-phase2/RFP-IT-Mod-P2.pdf",
      "https://www.manchesternh.gov/purchasing/it-modernization-phase2/Network-Diagram.pdf",
    ],
  },
  "Annual Road Paving Program 2025": {
    ai_summary: `Nashua's annual road paving program covering approximately 15 miles of roadway across the city. This is a recurring annual contract.

Scope: Milling (2-inch depth), paving (2-inch HMA surface course), line striping, and ADA-compliant ramp upgrades at all intersections along paved routes. Specific streets to be determined by City Engineer.

Budget: $2,000,000+. Unit pricing required for milling (per SY), paving (per ton), and ramp work (per each).

Timeline: Work window is May 1 - October 31, 2025. Night work may be required on arterial roads.

Who should bid: Paving contractors with NH DOT prequalification and capacity for 15+ miles in a season. Must own or lease sufficient equipment for concurrent operations.`,
    bid_requirements: [
      { label: "NH DOT Prequalification", details: "Current prequalification for highway construction" },
      { label: "Performance Bond", details: "100% of contract value" },
      { label: "Auto Liability Insurance", details: "Minimum $1,000,000 per occurrence" },
      { label: "Traffic Control Certification", details: "ATSSA or equivalent for all flaggers" },
      { label: "Prevailing Wage Compliance" },
      { label: "Equipment List", details: "Must demonstrate sufficient owned/leased equipment" },
    ],
  },
  "Water Treatment Plant Upgrades": {
    ai_summary: `Dover Water Works needs engineering design and construction management for upgrades to the Pudding Hill Water Treatment Plant, a critical infrastructure facility serving 30,000+ residents.

Scope: Filter media replacement (4 rapid sand filters), chemical feed system upgrades (coagulant, fluoride, pH adjustment), SCADA system integration with existing Wonderware platform, and electrical upgrades to support new equipment.

Budget: $3M - $5M for construction; this RFP covers engineering/CM services estimated at 12-15% of construction cost.

Key constraints: Plant must remain operational throughout construction. Phased approach required with no more than 1 filter offline at a time.

Who should bid: Engineering firms with water treatment plant experience, PE licensed in NH, and familiarity with NHDES regulatory requirements.`,
    bid_requirements: [
      { label: "NH Professional Engineer License", details: "PE licensed in New Hampshire" },
      { label: "Professional Liability Insurance", details: "Minimum $2,000,000" },
      { label: "Water Treatment Experience", details: "5+ completed WTP projects in New England" },
      { label: "NHDES Familiarity", details: "Experience with NH Dept of Environmental Services permitting" },
      { label: "SCADA Integration Experience", details: "Wonderware/AVEVA platform experience preferred" },
    ],
    document_urls: [
      "https://www.dover.nh.gov/rfp/water-treatment-2025/RFQ-WTP-Upgrades.pdf",
      "https://www.dover.nh.gov/rfp/water-treatment-2025/Existing-Plant-Drawings.pdf",
      "https://www.dover.nh.gov/rfp/water-treatment-2025/Water-Quality-Data.pdf",
    ],
  },
  "Emergency Communications System Upgrade": {
    ai_summary: `Hillsborough County is upgrading its emergency radio communications to a P25 digital system, replacing aging analog infrastructure that has coverage gaps and interoperability issues.

Scope: Full P25 Phase II digital radio system including tower site infrastructure (5 sites), dispatch console equipment for 3 PSAPs, 500+ portable radios, 200+ mobile radios, and system integration/cutover support.

Budget: $8M - $12M. Multi-year phased implementation expected. Financing options may be considered.

Critical requirements: 97% portable coverage (on-street) across all county municipalities, interoperability with NH SPOTS system, and backward compatibility during transition period.

Who should bid: Communications system integrators with P25 deployment experience, FCC licensing capability, and capacity for county-scale implementations.`,
    bid_requirements: [
      { label: "P25 System Deployment Experience", details: "3+ completed P25 Phase II deployments" },
      { label: "FCC Licensing Capability", details: "Must handle all FCC frequency coordination and licensing" },
      { label: "Performance Bond", details: "100% of contract value" },
      { label: "Manufacturer Authorization", details: "Authorized dealer/integrator for proposed equipment" },
      { label: "Coverage Guarantee", details: "Must guarantee 97% portable coverage via propagation study" },
      { label: "24/7 System Support", details: "Ongoing maintenance with 2-hour emergency response" },
      { label: "Training Program", details: "Comprehensive training for dispatchers, technicians, and end users" },
    ],
  },
  "Comprehensive Financial Audit Services": {
    ai_summary: `Exeter seeks a CPA firm for annual comprehensive financial audits covering fiscal years 2025-2027, with option to extend for two additional years.

Scope: Annual ACFR preparation assistance, single audit (if federal expenditures exceed threshold), management letter, and presentation to Board of Selectmen. Must comply with Government Auditing Standards (Yellow Book) and GASB pronouncements.

Who should bid: CPA firms with municipal audit experience in New Hampshire, familiarity with GASB standards, and capacity to complete fieldwork within 8 weeks of fiscal year-end.`,
    bid_requirements: [
      { label: "Licensed CPA Firm", details: "Licensed in State of New Hampshire" },
      { label: "Government Auditing Standards", details: "Peer review compliant with Yellow Book standards" },
      { label: "Municipal Audit Experience", details: "Currently serving 3+ NH municipalities" },
      { label: "Professional Liability Insurance", details: "Minimum $1,000,000" },
    ],
  },
  "Environmental Site Assessment - Former Mill Property": {
    ai_summary: `Berlin needs Phase I and Phase II Environmental Site Assessments for the former Brown Paper Company mill property — a 45-acre brownfield site along the Androscoggin River that the city is exploring for redevelopment.

Scope: Phase I ESA per ASTM E1527-21, followed by Phase II ESA including soil borings, groundwater monitoring well installation, and laboratory analysis. Known concerns include petroleum products, PCBs, and potential asbestos in remaining structures.

Budget: $75,000 - $150,000. Phased invoicing acceptable.

Who should bid: Environmental consulting firms with brownfield assessment experience, NH Licensed Environmental Professional on staff, and familiarity with EPA Brownfields program and NHDES cleanup standards.`,
    bid_requirements: [
      { label: "NH Licensed Environmental Professional", details: "LEP on staff or subcontracted" },
      { label: "Professional Liability Insurance", details: "Minimum $1,000,000" },
      { label: "ASTM E1527-21 Compliance", details: "Phase I per current ASTM standard" },
      { label: "Brownfield Assessment Experience", details: "5+ completed brownfield assessments in New England" },
      { label: "Laboratory Subcontractor", details: "NELAP-accredited laboratory for analytical work" },
    ],
  },
};

async function enrich() {
  console.log("Enriching RFP records...");

  for (const [title, data] of Object.entries(ENRICHMENTS)) {
    const { error } = await supabase
      .from("rfps")
      .update({
        ai_summary: data.ai_summary || null,
        ai_summary_generated_at: data.ai_summary ? new Date().toISOString() : null,
        bid_requirements: data.bid_requirements || [],
        document_urls: data.document_urls || [],
        estimated_value: data.estimated_value || undefined,
      })
      .eq("title", title);

    if (error) {
      console.error(`Error updating "${title}":`, error.message);
    } else {
      console.log(`Updated: ${title}`);
    }
  }

  console.log("Enrichment complete.");
}

enrich().catch(console.error);
