import Link from "next/link";
import { StarButton } from "@/components/Layout/StarButton";

const PROMISES = [
  {
    title: "No uploads",
    body: "Your statement is read by a file input and parsed in-memory. There is no form submission, no multipart POST, no API endpoint.",
  },
  {
    title: "No server-side code touches your data",
    body: "The pages ship as static HTML plus a JavaScript bundle. The server only serves files — it never sees a transaction.",
  },
  {
    title: "No third-party scripts",
    body: "Zero analytics. No Google Analytics, Sentry, Vercel Analytics, or any other tracking. Fonts are self-hosted.",
  },
  {
    title: "No localStorage",
    body: "Nothing is persisted between sessions. Closing the tab wipes everything.",
  },
  {
    title: "Strict Content-Security-Policy",
    body: "The browser enforces connect-src 'self' — meaning the page literally cannot contact any third party, even if a bug tried to.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 0 1-.75.75H5.56l3.97 3.97a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 1 1 1.06 1.06L5.56 9.25h10.69A.75.75 0 0 1 17 10Z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <StarButton />
      </div>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
        Verify it yourself.
      </h1>
      <p className="mt-4 text-lg leading-7 text-zinc-600 dark:text-zinc-300">
        Every privacy claim on this site is testable in under a minute. Follow
        these steps before trusting us with your statement.
      </p>

      <section className="mt-12">
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900">
            1
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Watch the Network tab
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              <li>
                Open your browser&apos;s DevTools (F12 on Windows/Linux, ⌥⌘I
                on macOS).
              </li>
              <li>
                Switch to the <strong>Network</strong> tab.
              </li>
              <li>Click the clear button to empty the log.</li>
              <li>
                Head to{" "}
                <Link
                  href="/analyse"
                  className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  the app
                </Link>{" "}
                and upload your statement.
              </li>
              <li>
                Watch the Network log. You should see <strong>zero</strong>{" "}
                new requests while your file is parsed and categorised.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900">
            2
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Turn off your Wi-Fi
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              The strongest test: disconnect from the internet, reload the
              app, and upload your statement. If it still works, the app
              can&apos;t possibly be sending your data anywhere.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900">
            3
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Check the Content-Security-Policy header
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Every response from this site carries this header:
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-zinc-200/60 bg-zinc-50 p-4 text-xs leading-5 text-zinc-700 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-300">
{`Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-<per-request>' 'strict-dynamic';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self';
  worker-src 'self' blob:;
  frame-ancestors 'none';
  form-action 'none';
  base-uri 'self';
  object-src 'none';
  upgrade-insecure-requests;`}
            </pre>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              The load-bearing directive is{" "}
              <code className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900">
                connect-src &apos;self&apos;
              </code>
              : it tells the browser to <em>refuse</em> any outbound network
              request beyond this domain. Even if a bug tried to exfiltrate
              your data, the browser would block it.
            </p>
          </div>
        </div>
      </section>

      <h2 className="mt-16 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        What we promise
      </h2>
      <ul className="mt-4 space-y-3">
        {PROMISES.map((p) => (
          <li
            key={p.title}
            className="flex gap-3 rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none"
          >
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {p.title}
              </div>
              <div className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">
                {p.body}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-none">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Found something that worries you?
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Open an issue on GitHub or email us. Do not paste any transaction
          content into a bug report — describe what you saw in terms of file
          sizes, timestamps, or the structure of the problem, never the
          specifics.
        </p>
      </div>
    </main>
  );
}
