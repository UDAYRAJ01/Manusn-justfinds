/**
 * Resolve the current search query from either router state or the browser URL.
 * Wouter may provide a pathname without `location.search`, so the browser
 * fallback keeps deep-linked taxonomy pages scoped to their selected category.
 */
export function getSearchQueryParams(routerLocation: string, browserSearch = "") {
  const queryStart = routerLocation.indexOf("?");
  const rawQuery = queryStart >= 0 ? routerLocation.slice(queryStart + 1) : browserSearch.replace(/^\?/, "");
  return new URLSearchParams(rawQuery);
}
