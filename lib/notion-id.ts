const collator = new Intl.Collator("en", { numeric: true });

/** Ascending natural order (DESIGN-999 before DESIGN-1000); blank IDs go last. */
export function compareNotionId(a: string, b: string): number {
  if (!a !== !b) return a ? -1 : 1;
  return collator.compare(a, b);
}
