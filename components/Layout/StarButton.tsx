// "Star on GitHub" pill — GitHub mark + live star count. Count is
// generated at build time by scripts/fetch-github-stars.mjs (see the
// `prebuild` npm script) so nothing hits the network at runtime. A
// stale-by-one-deploy number is an acceptable trade for keeping the
// strict `connect-src 'self'` CSP intact on every page.

import { GITHUB_STAR_COUNT } from "@/lib/generated/github-stars";

const REPO_URL = "https://github.com/corrinsg/sotto";

function formatStarCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

export function StarButton() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Sotto on GitHub — ${GITHUB_STAR_COUNT} stars`}
      className="group inline-flex shrink-0 items-stretch overflow-hidden rounded-full border border-zinc-200 bg-white text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 sm:text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-none dark:hover:border-zinc-700"
    >
      <span className="flex items-center px-2.5 py-1.5 transition group-hover:bg-zinc-50 sm:px-3 sm:py-2 dark:group-hover:bg-zinc-800">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg>
      </span>
      <span className="flex items-center gap-1 border-l border-zinc-200 bg-zinc-50 px-2.5 py-1.5 tabular-nums transition group-hover:bg-zinc-100 sm:px-3 sm:py-2 dark:border-zinc-800 dark:bg-zinc-800/60 dark:group-hover:bg-zinc-800">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5 text-amber-500"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
            clipRule="evenodd"
          />
        </svg>
        {formatStarCount(GITHUB_STAR_COUNT)}
      </span>
    </a>
  );
}
