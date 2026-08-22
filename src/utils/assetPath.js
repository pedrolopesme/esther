/**
 * Prepend basePath to asset paths when deployed (e.g. GitHub Pages).
 * Returns the path unchanged when running locally (no basePath).
 */
export function assetPath(path) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return basePath + path;
}