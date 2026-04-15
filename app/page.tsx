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
    body: "Categories, totals, and charts appear instantly. Tag anything we couldn't categorise.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.07),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]"
        aria-hidden
      />

      <section className="mx-auto w-full max-w-4xl px-6 pb-16 pt-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Your statement never leaves your browser
        </div>
        <h1 className="mt-6 text-5xl font-bold tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
          See where your money goes
          <br />
          without handing it over.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-zinc-600 dark:text-zinc-300">
          Sotto turns your bank statement into a clear spend breakdown. The
          parsing runs entirely in your browser — no uploads, no accounts, no
          telemetry. Verify it yourself.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 dark:bg-emerald-500 dark:shadow-emerald-500/20 dark:hover:bg-emerald-400 dark:hover:shadow-emerald-500/30"
          >
            Analyse your statement
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.69l-3.97-3.97a.75.75 0 0 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.97-3.97H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <Link
            href="/privacy"
            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-7 py-3.5 text-sm font-semibold text-zinc-800 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Is my privacy protected?
          </Link>
        </div>
        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
          PDF support is limited to a few bank formats today; CSV export works
          for most banks.
        </p>
      </section>

      <section className="mx-auto w-full max-w-4xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none dark:hover:border-zinc-700"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900">
                {i + 1}
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-white p-8 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900 dark:shadow-none">
          <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Why not just trust us?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Because you don&apos;t have to. Open your browser&apos;s DevTools,
            switch to the Network tab, and upload your PDF. You&apos;ll see
            zero outbound requests. Turn off your Wi-Fi and try again — it
            still works.
          </p>
          <Link
            href="/privacy"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Read the full verification guide
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.69l-3.97-3.97a.75.75 0 0 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.97-3.97H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
