// Slug + short-reference helpers shared by public marketplace surfaces.

export function slugify(input: string, maxLength = 80): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return base;
}

// Deterministic unique-ish slug: readable base + first id segment for public
// URLs that never collide (`downtown-summer-market-9f3a21c4`).
export function slugWithRef(title: string, id: string): string {
  const ref = id.replace(/-/g, "").slice(0, 8);
  const base = slugify(title, 60);
  return base ? `${base}-${ref}` : ref;
}

// Accepts either a full slugWithRef or a bare uuid and returns the lookup key.
export function refFromSlug(slugOrId: string): string {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(slugOrId)) return slugOrId;
  const tail = slugOrId.split("-").at(-1) ?? "";
  return tail;
}
