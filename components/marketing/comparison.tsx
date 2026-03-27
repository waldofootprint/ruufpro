// Comparison table — RoofReady vs competitors.
// Shows why we're the better choice for small roofers.

import { FlowButton } from "@/components/ui/flow-button";

const ROWS = [
  { feature: "Monthly cost", us: "$0 – $99", roofle: "$350", roofr: "$249+", scorpion: "$3,000+" },
  { feature: "Setup fee", us: "$0", roofle: "$2,000", roofr: "$0", scorpion: "$0" },
  { feature: "First year cost", us: "$0 – $1,188", roofle: "$6,200+", roofr: "$2,988+", scorpion: "$36,000+" },
  { feature: "Free roofing website", us: true, roofle: false, roofr: false, scorpion: false },
  { feature: "Instant estimate widget", us: true, roofle: true, roofr: true, scorpion: false },
  { feature: "Satellite roof measurement", us: true, roofle: true, roofr: true, scorpion: false },
  { feature: "Lead capture", us: true, roofle: true, roofr: true, scorpion: true },
  { feature: "Review automation", us: true, roofle: false, roofr: false, scorpion: true },
  { feature: "Auto-reply & follow-up", us: true, roofle: false, roofr: false, scorpion: true },
  { feature: "Month-to-month (no contract)", us: true, roofle: false, roofr: true, scorpion: false },
  { feature: "Embed widget on any site", us: true, roofle: true, roofr: true, scorpion: false },
  { feature: "Own your site if you leave", us: true, roofle: "N/A", roofr: "N/A", scorpion: false },
  { feature: "Setup time", us: "5 minutes", roofle: "Hours", roofr: "Days", scorpion: "Weeks" },
];

function CellContent({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    );
  }
  if (value === false) {
    return (
      <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    );
  }
  return <span className="text-sm text-gray-600">{value}</span>;
}

export default function Comparison() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-brand-600 uppercase tracking-widest mb-3">
            Compare
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            How we stack up
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Same satellite-powered estimates. Free website included.
            71% cheaper than the leading competitor.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-sm font-medium text-gray-500 w-[30%]">Feature</th>
                <th className="px-4 py-4 text-center">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-sm font-bold text-brand-600">RoofReady</span>
                    <span className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full mt-1">Recommended</span>
                  </div>
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-500">Roofle</th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-500">Roofr</th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-500">Scorpion</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.feature}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                >
                  <td className="px-6 py-3.5 text-sm font-medium text-gray-900">
                    {row.feature}
                  </td>
                  <td className="px-4 py-3.5 text-center bg-brand-50/30">
                    <CellContent value={row.us} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <CellContent value={row.roofle} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <CellContent value={row.roofr} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <CellContent value={row.scorpion} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-10">
          <a href="/signup">
            <FlowButton text="Start for Free" />
          </a>
        </div>
      </div>
    </section>
  );
}
