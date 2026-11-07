// Public leak patterns: things that must never appear in shipped instructions.
// Private terms (real companies, recruiters, interviewers) do NOT belong here:
// publishing them would reveal where the maintainer applied. They live in
// `.leak-blocklist.local` (gitignored) or the file pointed to by LEAK_BLOCKLIST.
export const PUBLIC_PATTERNS = [
  // The repo's GitHub path (install commands) is allowed; the name anywhere else is not.
  { label: 'maintainer-name', regex: /\bBezael\b(?!\/dominicode-job-hunt\b)/i },
  { label: 'windows-path', regex: /(?<![\w:])[A-Za-z]:[\\/][^\s`'")]/ },
  { label: 'home-path', regex: /\/(?:Users|home)\/[^/\s`'")]+/ },
  { label: 'brand-folder', regex: /(^|[^\w])_brand\//i },
  { label: 'brand-name', regex: /dominicode(?!-job-hunt)/i },
  { label: 'salary-floor', regex: /\bUSD\s?60\s?k\b|\b60,000\b/i },
];
