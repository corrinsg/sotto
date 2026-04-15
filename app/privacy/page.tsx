import Link from "next/link";

const PROMISES = [
  {
    title: "No uploads",
    body: "Your PDF is read by a file input and parsed in-memory. There is no form submission, no multipart POST, no API endpoint.",
  },
  {
    title: "No server-side code touches your data",
    body: "The /app page ships as static HTML plus a JavaScript bundle. The server only serves files — it never sees a transaction.",
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
      <Link
        href="/"
        className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-900"
      >
        ← Back
      </Link>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-950">
        Verify it yourself.
      </h1>
      <p className="mt-4 text-lg leading-7 text-zinc-600">
        Every privacy claim on this site is testable in under a minute. Follow
        these steps before trusting us with your statement.
      </p>

      <h2 className="mt-12 text-xl font-semibold text-zinc-900">
        1. Watch the Network tab
      </h2>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-6 text-zinc-700">
        <li>Open your browser&apos;s DevTools (F12 on Windows/Linux, ⌥⌘I on macOS).</li>
        <li>Switch to the <strong>Network</strong> tab.</li>
        <li>Click the clear button to empty the log.</li>
        <li>
          Head to <Link href="/app" className="underline">the app</Link> and
          upload your PDF.
        </li>
        <li>
          Watch the Network log. You should see <strong>zero</strong> new
          requests while your file is parsed and categorized.
        </li>
      </ol>

      <h2 className="mt-12 text-xl font-semibold text-zinc-900">
        2. Turn off your Wi-Fi
      </h2>
      <p className="mt-3 text-sm leading-6 text-zinc-700">
        The strongest test: disconnect from the internet, reload the app, and
        upload your PDF. If it still works, the app can&apos;t possibly be
        sending your data anywhere.
      </p>

      <h2 className="mt-12 text-xl font-semibold text-zinc-900">
        3. Check the Content-Security-Policy header
      </h2>
      <p className="mt-3 text-sm leading-6 text-zinc-700">
        Every response from this site carries this header:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs leading-5 text-zinc-100">
{`Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self' data:;
  connect-src 'self';
  worker-src 'self' blob:;
  frame-ancestors 'none';
  form-action 'none';
  base-uri 'self';
  object-src 'none';`}
      </pre>
      <p className="mt-3 text-sm leading-6 text-zinc-700">
        The load-bearing directive is <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">connect-src &apos;self&apos;</code>:
        it tells the browser to <em>refuse</em> any outbound network request
        beyond this domain. Even if a bug tried to exfiltrate your data, the
        browser would block it.
      </p>

      <h2 className="mt-12 text-xl font-semibold text-zinc-900">What we promise</h2>
      <ul className="mt-4 space-y-4">
        {PROMISES.map((p) => (
          <li
            key={p.title}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="text-sm font-semibold text-zinc-900">{p.title}</div>
            <div className="mt-1 text-sm text-zinc-600">{p.body}</div>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Found something that worries you?</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Open an issue on GitHub or email us. Do not paste any transaction
          content into a bug report — describe what you saw in terms of file
          sizes, timestamps, or the structure of the problem, never the
          specifics.
        </p>
      </div>
    </main>
  );
}
