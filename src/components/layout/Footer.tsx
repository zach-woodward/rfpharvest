import Link from "next/link";
import { TOPICS } from "@/lib/seo/topics";
import { GUIDES } from "@/lib/seo/guides";

const YEAR = new Date().getFullYear();

export default function Footer() {
  const topTopics = TOPICS.slice(0, 8);
  const topGuides = GUIDES.slice(0, 4);

  return (
    <footer className="border-t border-slate-200 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Browse</h3>
            <ul className="space-y-2 text-slate-600">
              <li><Link href="/rfps" className="hover:text-forest-700">All states</Link></li>
              <li><Link href="/rfps/nh" className="hover:text-forest-700">New Hampshire</Link></li>
              <li><Link href="/rfps/me" className="hover:text-forest-700">Maine</Link></li>
              <li><Link href="/rfps/ma" className="hover:text-forest-700">Massachusetts</Link></li>
              <li><Link href="/rfps/ct" className="hover:text-forest-700">Connecticut</Link></li>
              <li><Link href="/rfps/ri" className="hover:text-forest-700">Rhode Island</Link></li>
              <li><Link href="/rfps/vt" className="hover:text-forest-700">Vermont</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">By trade</h3>
            <ul className="space-y-2 text-slate-600">
              {topTopics.map((t) => (
                <li key={t.slug}>
                  <Link href={`/rfps/topic/${t.slug}`} className="hover:text-forest-700">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Guides</h3>
            <ul className="space-y-2 text-slate-600">
              {topGuides.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="hover:text-forest-700">
                    {g.title.length > 45 ? g.title.slice(0, 45) + "…" : g.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/guides" className="text-forest-700 font-medium hover:underline">
                  All guides →
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">RFP Harvest</h3>
            <ul className="space-y-2 text-slate-600">
              <li><Link href="/" className="hover:text-forest-700">Home</Link></li>
              <li><Link href="/dashboard" className="hover:text-forest-700">Dashboard</Link></li>
              <li><Link href="/auth/signup" className="hover:text-forest-700">Sign up free</Link></li>
              <li><Link href="/request-town" className="hover:text-forest-700">Request a town</Link></li>
              <li>
                <a href="mailto:support@rfpharvest.com" className="hover:text-forest-700">
                  support@rfpharvest.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
          <div>© {YEAR} RFP Harvest</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-700">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-700">Terms</Link>
            <span>Municipal bid opportunities, updated every 6 hours.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
