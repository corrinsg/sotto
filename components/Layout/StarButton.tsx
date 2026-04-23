// "Star on GitHub" pill used in each page's header. Kept as a plain <a>
// (no github.com/buttons iframe, no unauthenticated API call) so nothing
// hits the network until the user clicks through.

const REPO_URL = "https://github.com/corrinsg/sotto";

export function StarButton() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Star Sotto on GitHub"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 sm:px-3.5 sm:py-2 sm:text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
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
      <span className="hidden sm:inline">Star on GitHub</span>
      <span className="sm:hidden">Star</span>
    </a>
  );
}
