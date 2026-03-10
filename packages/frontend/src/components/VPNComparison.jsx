export default function VPNComparison() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-2">
          <section className="overflow-hidden rounded-lg border border-red-500/40 bg-[#0b1020] shadow-lg">
            <header className="border-b border-red-500/40 bg-red-600/20 px-4 py-3">
              <h2 className="font-mono text-sm font-semibold text-red-300">
                Without VPN Protection
              </h2>
            </header>
            <pre className="overflow-x-auto p-4 font-mono text-sm leading-6 text-slate-200">
{`{
  "endpoint": "/submit-report",
  "ip": "192.168.1.104",
  "sessionId": "a3f9c2e1-8b4d-4f6a",
  "userAgent": "Mozilla/5.0 Chrome/122 Windows NT",
  "timestamp": "23:41:07",
  "location": "Bangkok, Thailand",
  "identity": "`}
                <span className="font-semibold text-red-400">EXPOSED</span>
{`"
}`}
            </pre>
          </section>

          <section className="overflow-hidden rounded-lg border border-emerald-500/40 bg-[#0b1020] shadow-lg">
            <header className="border-b border-emerald-500/40 bg-emerald-600/20 px-4 py-3">
              <h2 className="font-mono text-sm font-semibold text-emerald-300">
                With VPN + SafeNest
              </h2>
            </header>
            <pre className="overflow-x-auto p-4 font-mono text-sm leading-6 text-slate-200">
{`{
  "endpoint": "/submit-report",
  "ip": `}
                <span className="font-semibold text-lime-400">null</span>
{`,
  "sessionId": `}
                <span className="font-semibold text-lime-400">null</span>
{`,
  "userAgent": `}
                <span className="font-semibold text-lime-400">null</span>
{`,
  "timestamp": `}
                <span className="font-semibold text-lime-400">null</span>
{`,
  "location": `}
                <span className="font-semibold text-lime-400">null</span>
{`,
  "identity": `}
                <span className="font-semibold text-lime-400">null</span>
{`
}`}
            </pre>
          </section>
        </div>

        <p className="mt-6 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200">
          SafeNest strips all identity metadata before any report reaches the server. Combined
          with a VPN like ExpressVPN, the report is completely untraceable.
        </p>
      </div>
    </div>
  );
}
