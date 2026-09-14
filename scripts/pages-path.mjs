/** Resolve a project site, a username.github.io site, or a custom-domain root. */
export function resolvePagesBasePath(env = process.env) {
  // configure-pages supplies an explicit empty string for root/custom-domain sites.
  let value = env.NEXT_PUBLIC_BASE_PATH;
  if (value === undefined) {
    const [owner, repo] = (env.GITHUB_REPOSITORY ?? "").split("/");
    value = repo && repo.toLowerCase() !== `${owner}.github.io`.toLowerCase() ? `/${repo}` : "";
  }

  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return "";
  if (!/^[A-Za-z0-9._/-]+$/.test(trimmed) || trimmed.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("Invalid Pages base path. Use an empty string or /your-repository-name.");
  }
  return `/${trimmed}`;
}
