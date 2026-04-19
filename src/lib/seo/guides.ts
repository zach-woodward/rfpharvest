export interface Guide {
  slug: string;
  title: string;
  metaDescription: string;
  subtitle: string;
  readMinutes: number;
  sections: GuideSection[];
  faq?: { q: string; a: string }[];
  internalLinks?: { label: string; href: string }[];
}

export interface GuideSection {
  heading: string;
  paragraphs: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: "what-is-an-rfp",
    title: "What Is an RFP? A Plain-English Guide for Small Contractors",
    metaDescription:
      "What an RFP is, how it differs from RFQs, IFBs, and RFIs, and how small contractors use them to win municipal work. Plain-English explanations with examples.",
    subtitle:
      "Everything a small contractor needs to know about requests for proposals, without the procurement jargon.",
    readMinutes: 6,
    sections: [
      {
        heading: "The short version",
        paragraphs: [
          "A request for proposal (RFP) is a public document in which a government agency — a city, town, school district, county, or state — describes work it needs done and invites qualified companies to submit proposals. You read the RFP, write up how you'd do the work and what you'd charge, send it in by the deadline, and the agency scores proposals against the criteria they published.",
          "That's it. Everything else is process detail on top.",
        ],
      },
      {
        heading: "What an RFP actually contains",
        paragraphs: [
          "A typical municipal RFP runs 20 to 60 pages and always includes the same handful of parts: a scope of work that describes the project, submission requirements telling you what to put in your proposal, evaluation criteria showing how you'll be scored, a timeline with the deadline and key dates, required forms like W-9 or MBE certifications, and contract terms you'd be agreeing to if selected.",
          "If any of those sections confuse you, the RFP will name a procurement officer whose email you can write to. Asking clarifying questions before the deadline is normal and expected — it's not a sign of weakness. Agencies publish Q&A responses publicly so every bidder sees the same answers.",
        ],
      },
      {
        heading: "RFP vs RFQ vs IFB vs RFI",
        paragraphs: [
          "These four acronyms get used interchangeably by people who don't know the difference, which makes it confusing to search for work. Here's the real distinction:",
          "IFB (Invitation for Bid) is price-only. The scope is rigid, the specifications are exact, and the low responsive bidder wins. Most construction work uses this format.",
          "RFP (Request for Proposal) is quality-plus-price. The agency describes what it needs but wants your recommended approach, your team, and your price. Evaluation is weighted across several criteria. Professional services, consulting, and software typically use RFPs.",
          "RFQ (Request for Qualifications, sometimes Request for Quote) is qualifications-first. You submit your team's resume and past projects. A short list is invited back to submit full proposals. Used heavily for engineering and architectural services.",
          "RFI (Request for Information) is a scouting exercise. The agency is gathering market information before it knows what to buy. Responding to an RFI doesn't win you work, but it gets you known to the procurement team.",
        ],
      },
      {
        heading: "Where RFPs live",
        paragraphs: [
          "Every municipality posts its own bids on its own website. Larger cities sometimes use shared procurement portals like Public Purchase, BidNet Direct, OpenGov, or CivicPlus. Smaller towns just have a \"Bids & RFPs\" page on their main site.",
          "That fragmentation is the reason RFP Harvest exists. Instead of checking fifty town websites manually every week, we scrape them all every six hours and surface new bids in one place. You can filter by state, by town, or by trade, and set email alerts on keywords that matter to your business.",
        ],
      },
      {
        heading: "Your next step",
        paragraphs: [
          "If you've never bid on public work before, the cheapest way to learn is to download a few RFPs in your trade and read them cover to cover. You don't have to submit. Reading ten real RFPs will teach you more about public procurement than any article, including this one.",
          "When you're ready to start getting alerts on new opportunities, sign up free and pick the trades you care about.",
        ],
      },
    ],
    faq: [
      {
        q: "How long does the RFP process usually take?",
        a: "From posting to contract award is typically 6–12 weeks for a professional services RFP and 4–8 weeks for a construction IFB. Proposal deadlines are usually 3–5 weeks after the RFP is posted.",
      },
      {
        q: "Do I need to be a certified small business to bid?",
        a: "No. Municipal bids are generally open to any qualified company. Some agencies offer scoring preferences for certified minority-, woman-, or veteran-owned businesses, but certification is rarely a hard requirement.",
      },
      {
        q: "Can I ask questions about the RFP?",
        a: "Yes, and you should. The RFP will name a procurement officer and set a Q&A deadline. Submit questions in writing before that deadline; the agency publishes answers to all bidders so everyone sees the same information.",
      },
    ],
    internalLinks: [
      { label: "How to Win Your First Municipal RFP", href: "/guides/how-to-win-your-first-municipal-rfp" },
      { label: "Understanding Bid Bonds and Performance Bonds", href: "/guides/bid-bonds-and-performance-bonds" },
      { label: "Browse open RFPs by state", href: "/rfps" },
    ],
  },

  {
    slug: "how-to-win-your-first-municipal-rfp",
    title: "How to Win Your First Municipal RFP",
    metaDescription:
      "A step-by-step playbook for small contractors winning their first government RFP. What to look for, how to price, how to write the proposal, and what beginners get wrong.",
    subtitle:
      "A step-by-step playbook — what to look for, how to price, and what first-time bidders most often get wrong.",
    readMinutes: 9,
    sections: [
      {
        heading: "Pick RFPs you can actually win",
        paragraphs: [
          "The single biggest mistake first-time bidders make is going after the wrong projects. A $2M road reconstruction RFP is not the right target for a three-person paving crew. Nor is a twenty-page scope with \"preferred vendor must have 10 years of municipal experience\" going to be won by someone on their first public bid.",
          "Look for RFPs where you meet every listed qualification, the project size matches your capacity plus 20–30% upside, and ideally a local preference or small business scoring component plays to your favor. You want to come out of your first bid having genuinely had a shot, win or lose.",
        ],
      },
      {
        heading: "Read the whole thing twice",
        paragraphs: [
          "Everyone says to read the RFP carefully. Here's what actually happens: contractors skim it, focus on the scope and the deadline, and miss something in the fine print. Favorite hiding spots for deal-breakers: insurance requirements, bonding requirements, mandatory site visit rules (attending the pre-bid meeting is sometimes required to submit), MBE subcontracting goals, and the proposal format itself.",
          "On your first real bid, read the whole document twice. Then make a checklist of every requirement — insurance limits, certifications, forms to include, formatting rules — and check each one off as you go.",
        ],
      },
      {
        heading: "Attend the pre-bid meeting",
        paragraphs: [
          "If there's a pre-bid meeting, go. Even if it isn't mandatory. You'll meet the procurement officer, see who else is bidding, and get a read on what the agency cares about that isn't written in the RFP.",
          "Bring a notepad, ask specific questions, and send a thank-you email afterward. These small gestures matter more in municipal work than people admit.",
        ],
      },
      {
        heading: "Price like you mean to deliver",
        paragraphs: [
          "The second biggest first-bid mistake is underpricing to win. It's tempting, especially when you know your competitors. Don't do it. Public projects have fixed scopes, strict change-order rules, and no forgiveness for underestimating.",
          "Price at your real cost plus a normal margin. If someone else is willing to lose money on the job, let them. A lost bid costs you a week of proposal work. A won bid at a loss costs your business.",
        ],
      },
      {
        heading: "Write for the scoring rubric",
        paragraphs: [
          "RFPs publish their evaluation criteria with point weights. If past performance is 30 points, technical approach is 40, price is 30 — write your proposal in that proportion. Spend most of your words on the 40-point section, not on your company history.",
          "Respond to every requirement explicitly. Evaluators often use a compliance matrix: if you don't address something, you lose those points even if you had an answer. \"See attached\" is not a response — quote the requirement and state your approach inline.",
        ],
      },
      {
        heading: "Get it in early",
        paragraphs: [
          "A proposal that arrives two minutes late is rejected. Not \"we'll consider it\" — rejected. Plan to submit 24 hours early if mailing, or 1–2 hours early if electronic.",
          "Budget for a printer jam, a DocuSign failure, or a courier being stuck in traffic. Every experienced municipal contractor has at least one war story about the bid they almost missed because of a logistics problem at 4:55pm on deadline day.",
        ],
      },
      {
        heading: "Debrief either way",
        paragraphs: [
          "If you lose, ask for a debrief. Most agencies will tell you your scoring breakdown and where the winner beat you. That intel is worth more than the next three RFPs you read.",
          "If you win, read the award letter carefully for conditions — bonding, insurance, contract execution deadlines. A \"won\" bid isn't really won until the contract is signed.",
        ],
      },
    ],
    faq: [
      {
        q: "How long should my first proposal take to write?",
        a: "Budget 40–80 hours for your first municipal RFP. After five or six, you'll have reusable content and it drops to 15–25 hours per bid.",
      },
      {
        q: "Should I hire a proposal writer?",
        a: "Not for your first bid. Write it yourself so you learn the format and the language. Consider a writer once you're bidding 10+ times a year and it's time to scale.",
      },
      {
        q: "What's a realistic win rate?",
        a: "Experienced small municipal contractors win 15–30% of qualified bids. First-time bidders often win 0 of their first 3–5 — that's normal. Keep going.",
      },
    ],
    internalLinks: [
      { label: "What is an RFP? Plain-English guide", href: "/guides/what-is-an-rfp" },
      { label: "Understanding Bid Bonds and Performance Bonds", href: "/guides/bid-bonds-and-performance-bonds" },
      { label: "Browse open RFPs by trade", href: "/rfps" },
    ],
  },

  {
    slug: "bid-bonds-and-performance-bonds",
    title: "Bid Bonds, Performance Bonds, and Payment Bonds — Explained",
    metaDescription:
      "What bid bonds, performance bonds, and payment bonds are, how much they cost, how to get them as a small contractor, and how they work on municipal projects.",
    subtitle:
      "The three bonds you'll encounter on municipal work, what they cost, and how to qualify as a small contractor.",
    readMinutes: 7,
    sections: [
      {
        heading: "Why bonds exist",
        paragraphs: [
          "Public agencies can't afford to pick a cheap bidder who disappears halfway through the project or stiffs their subcontractors. Surety bonds transfer that risk to a bonding company. If the contractor fails, the bonding company steps in to finish the job or pay the agency damages, then collects from the contractor.",
          "Three kinds of bonds show up in municipal work: bid bonds, performance bonds, and payment bonds. They often come as a package on larger projects.",
        ],
      },
      {
        heading: "Bid bonds",
        paragraphs: [
          "A bid bond is submitted with your proposal. It guarantees that if you're selected, you'll actually sign the contract and provide the required performance bond. If you win and walk away, the bonding company pays the difference between your price and the next bidder's price, up to the bond amount — usually 5% or 10% of your bid.",
          "Bid bonds are typically free or very inexpensive. If your surety declines to issue one, that's a signal the job is too large for your current bonding capacity.",
        ],
      },
      {
        heading: "Performance bonds",
        paragraphs: [
          "A performance bond is issued after you win and kicks in for the duration of the project. It guarantees you'll complete the work according to the contract. If you default, the surety either hires someone to finish or pays the agency to cover the cost.",
          "Performance bonds are usually 100% of the contract value on public work. Cost is 1–3% of the bond amount, paid upfront. Expect roughly 1% for strong financials and 3% for newer or weaker contractors.",
        ],
      },
      {
        heading: "Payment bonds",
        paragraphs: [
          "Payment bonds protect subcontractors and suppliers. If the GC doesn't pay them, they can claim against the bond. This exists because on public projects, subs can't file mechanic's liens — the payment bond is the substitute.",
          "Performance and payment bonds are usually issued together; the 1–3% rate covers both.",
        ],
      },
      {
        heading: "How to qualify for bonding",
        paragraphs: [
          "Surety companies underwrite on three Cs: capital, capacity, and character. In plain English: strong financial statements, a track record of similar-sized completed projects, and a clean legal and credit history.",
          "First-time contractors typically qualify for small-project programs (SBA bond guarantee, for example) with simpler requirements. Start there and build a track record of completed bonded projects. Your single-project capacity and aggregate capacity grow with your history.",
        ],
      },
      {
        heading: "Practical steps",
        paragraphs: [
          "Get a bonding agent before you need one. Most agents work with many surety carriers and will shop your submission. Build the relationship early and keep your bonding file updated — a current agent can turn around a bid bond in a day; a stranger can't.",
          "When you see a promising RFP, forward the bond requirements to your agent before you spend time on the proposal. Don't write a 40-hour bid for a project you can't actually bond.",
        ],
      },
    ],
    faq: [
      {
        q: "Are bonds required on every municipal project?",
        a: "No. Federal and most state thresholds require bonds on public construction projects above a dollar amount (often $100k–$250k). Services-only RFPs rarely require bonds.",
      },
      {
        q: "Can I use a letter of credit instead?",
        a: "Sometimes, for bid bonds. Performance and payment bonds almost always have to come from a surety. Check the RFP's specific language.",
      },
      {
        q: "How long does it take to get bonded for the first time?",
        a: "2–4 weeks from first contact with a surety agent if your financials are ready. Longer if you need to prepare reviewed or audited financial statements.",
      },
    ],
    internalLinks: [
      { label: "How to Win Your First Municipal RFP", href: "/guides/how-to-win-your-first-municipal-rfp" },
      { label: "Prequalification for Public Work", href: "/guides/prequalification-for-public-work" },
    ],
  },

  {
    slug: "prequalification-for-public-work",
    title: "Prequalification: Getting Approved to Bid on Public Projects",
    metaDescription:
      "How municipal prequalification works, what documents agencies ask for, and how small contractors build a prequalification file that gets accepted.",
    subtitle:
      "What prequalification actually involves, what agencies look for, and how to build a file once and reuse it.",
    readMinutes: 5,
    sections: [
      {
        heading: "What prequalification is",
        paragraphs: [
          "Some agencies require contractors to be prequalified before they're allowed to submit on certain projects. The agency reviews your company's financials, past performance, and safety record in advance — so that on bid day, they only have to score the actual proposal.",
          "Prequalification is common for state DOT work, school construction authorities, and larger municipal building programs. Most smaller town RFPs don't require it.",
        ],
      },
      {
        heading: "What's in a prequalification package",
        paragraphs: [
          "A typical package asks for: the last three years of financial statements (reviewed or audited), a list of completed projects with references, current workload and backlog, key personnel resumes, insurance certificates, bonding capacity letter from your surety, EMR (experience modification rate) for workers' comp, and a corporate resolution authorizing the submission.",
          "First-timers often get stuck on the financial statement requirement. If you've been doing compiled statements, you may need to upgrade to reviewed statements for prequalification — budget 4–6 weeks and a few thousand dollars with your CPA.",
        ],
      },
      {
        heading: "Build it once, reuse it everywhere",
        paragraphs: [
          "Create a master prequalification binder with every piece of documentation and update it quarterly. When an agency asks for prequalification, you're editing a cover letter, not starting from scratch.",
          "Keep a spreadsheet of every past project with start date, end date, contract value, change order value, owner's contact, and a one-paragraph scope description. This is the single most useful document you can maintain for public work.",
        ],
      },
      {
        heading: "What agencies actually care about",
        paragraphs: [
          "Behind the paperwork, prequalifiers look for three things: can you afford to perform the work (capital), have you completed similar work without blowing up (history), and can you be reached and managed (professionalism in your submission).",
          "A clean, organized, on-time prequalification submission tells the agency as much as the numbers do. A messy package with missing pieces gets you declined even if your financials are strong.",
        ],
      },
    ],
    faq: [
      {
        q: "How long does prequalification take?",
        a: "4–8 weeks from complete submission to approval. Start months before you want to bid on the work.",
      },
      {
        q: "Does prequalification expire?",
        a: "Yes. Most agencies require annual recertification, often with updated financials.",
      },
    ],
    internalLinks: [
      { label: "Bid Bonds, Performance Bonds, and Payment Bonds — Explained", href: "/guides/bid-bonds-and-performance-bonds" },
      { label: "How to Win Your First Municipal RFP", href: "/guides/how-to-win-your-first-municipal-rfp" },
    ],
  },

  {
    slug: "small-business-guide-to-government-contracting",
    title: "The Small Business Guide to Government Contracting",
    metaDescription:
      "How small businesses get started with government contracts. Registrations you need, certifications that matter, and where to find municipal, state, and federal opportunities.",
    subtitle:
      "Registrations that matter, certifications worth getting, and a realistic first-year plan.",
    readMinutes: 7,
    sections: [
      {
        heading: "Three layers of government work",
        paragraphs: [
          "Most small businesses encounter government contracting as three distinct worlds: federal (Department of Defense, GSA, federal agencies), state (state DOT, state university systems), and local (cities, towns, school districts, counties). The three operate on different procurement platforms, different contract sizes, and different compliance regimes.",
          "For most small contractors, local is by far the best starting point. Contracts are smaller, competition is lighter, registration is simpler, and you don't need federal certifications to participate.",
        ],
      },
      {
        heading: "The registrations you'll eventually need",
        paragraphs: [
          "SAM.gov registration is required to bid on federal work and increasingly requested by state agencies. It's free but the form is tedious — budget half a day and do it once.",
          "Many states run their own vendor portals (for example, Massachusetts COMMBUYS or Maine's DAS vendor system) that require separate registration. Register in the states where you actually want to work, not all of them.",
          "On the local level, most towns don't require pre-registration at all — you just find the RFP on their website and submit. A few use Public Purchase or similar procurement platforms, which have one-time account setup.",
        ],
      },
      {
        heading: "Certifications that actually matter",
        paragraphs: [
          "Small Business Administration (SBA) 8(a) certification can be valuable for federal work — it qualifies you for sole-source contracts up to $4.5M. Expect 6+ months and substantial paperwork.",
          "MBE (Minority Business Enterprise), WBE (Woman Business Enterprise), and VBE (Veteran Business Enterprise) certifications carry scoring weight on state and local RFPs, sometimes 5–10 points. Worth pursuing if you qualify. Certification is handled state by state.",
          "DBE (Disadvantaged Business Enterprise) is specific to federally-funded transportation projects. If you're in highway, transit, or airport work, this matters. Otherwise don't bother.",
        ],
      },
      {
        heading: "A realistic first-year plan",
        paragraphs: [
          "Quarter 1: pick a state. Register where required. Find ten real RFPs in your trade and read them. Don't submit yet.",
          "Quarter 2: bid three to five times. Expect to lose. Ask for debriefs on every loss. Build your insurance, bonding, and financial documentation in parallel so you're prequalified when opportunities require it.",
          "Quarter 3: you start winning. Your first public contract is a learning project — do it well, collect the reference, take photos, document everything for your next proposal.",
          "Quarter 4: apply what you've learned at scale. One reference project makes your next five bids substantially more competitive.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I bid on municipal work as a sole proprietor?",
        a: "Yes, in most places, though many agencies prefer LLCs or corporations for liability reasons. An LLC is cheap to form and makes proposals look more credible.",
      },
      {
        q: "Do I need a bid writer?",
        a: "No — not initially. Learn the format yourself. Hire help once you're bidding 10+ times per year.",
      },
      {
        q: "What's the smallest municipal contract worth bidding on?",
        a: "Below roughly $10k, the paperwork usually isn't worth it. But small on-call contracts and blanket purchase orders can be worthwhile because they lead to repeat work.",
      },
    ],
    internalLinks: [
      { label: "What is an RFP? Plain-English guide", href: "/guides/what-is-an-rfp" },
      { label: "Prequalification for Public Work", href: "/guides/prequalification-for-public-work" },
      { label: "Browse open RFPs by state", href: "/rfps" },
    ],
  },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
