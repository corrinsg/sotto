// "Star on GitHub" pill — a single composite icon (GitHub mark inlaid
// in a filled star) plus the live star count. Count is generated at
// build time by scripts/fetch-github-stars.mjs (see the `prebuild` npm
// script) so nothing hits the network at runtime and the strict
// `connect-src 'self'` CSP stays intact.

import { GITHUB_STAR_COUNT } from "@/lib/generated/github-stars";

const REPO_URL = "https://github.com/corrinsg/sotto";

function formatStarCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

// Composite icon: amber-filled star outline + the GitHub octocat
// centered inside, rendered in a darker amber so it reads as "cut
// into" the star. Everything lives in one <svg> so there's no
// alignment drift between star and mark.
function StarWithGitHubMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-6 w-6 sm:h-7 sm:w-7"
      aria-hidden
    >
      <path
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
        fill="#f59e0b"
      />
      <g transform="translate(7.25 8.25) scale(0.594)">
        <path
          fill="#78350f"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
        />
      </g>
    </svg>
  );
}

export function StarButton() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Sotto on GitHub — ${GITHUB_STAR_COUNT} stars`}
      className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-zinc-700 transition-opacity hover:opacity-75 sm:text-base dark:text-zinc-200"
    >
      <StarWithGitHubMark />
      <span className="tabular-nums">{formatStarCount(GITHUB_STAR_COUNT)}</span>
    </a>
  );
}
