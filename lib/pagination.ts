export type PageItem = number | "ellipsis";

export function getPageItems(totalPages: number, currentPage: number): PageItem[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= 6) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage]);
  for (const page of [currentPage - 1, currentPage + 1]) {
    if (page > 1 && page < totalPages) pages.add(page);
  }
  if (currentPage <= 2) pages.add(3);
  if (currentPage >= totalPages - 1) pages.add(totalPages - 2);

  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1];
    return index > 0 && page - previous > 1 ? ["ellipsis" as const, page] : [page];
  });
}
