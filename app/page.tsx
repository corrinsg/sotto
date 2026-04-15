import Link from "next/link";

const STEPS = [
  {
    title: "Drop your statement",
    body: "PDF or CSV — select or drag it in. No account, no upload, no form submission.",
  },
  {
    title: "Your browser parses it",
    body: "Everything happens in your browser using WebAssembly. The file never touches a server.",
  },
  {
    title: "See your spend",
    body: "Categories, totals, and charts appear instantly. Tag anything we couldn't categorize.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-4xl px-6 pb-16 pt-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Your PDF never leaves your browser
        </div>
        <h1 className="mt-6 text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
          See where your money goes
          <br />
          without handing it over.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-zinc-600">
          Sotto turns your bank statement into a clear spend breakdown. The
          parsing runs entirely in your browser — no uploads, no accounts, no
          telemetry. Verify it yourself.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/app"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Analyze your statement
          </Link>
          <Link
            href="/privacy"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            How we prove it
          </Link>
        </div>
        <p className="mt-6 text-xs text-zinc-500">
          PDF support is limited to a few bank formats today; CSV export works
          for most banks.
        </p>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white">
                {i + 1}
              </div>
              <h3 className="text-base font-semibold text-zinc-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 pb-24">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-8 text-white">
          <h2 className="text-xl font-semibold">Why not just trust us?</h2>
          <p className="mt-3 text-sm text-zinc-300">
            Because you don&apos;t have to. Open your browser&apos;s DevTools,
            turn on the Network tab, and upload your PDF. You&apos;ll see zero
            outbound requests. Turn off your Wi-Fi and try again — it still
            works.
          </p>
          <Link
            href="/privacy"
            className="mt-6 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Read the full verification guide
          </Link>
        </div>
      </section>
    </main>
  );
}
