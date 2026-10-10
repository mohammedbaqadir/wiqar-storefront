/**
 * The catalogue gate, run during the build: problems fail the build, so the
 * last good deploy keeps serving. Rules live here and nowhere else.
 */
import type { ApiCatalog, ApiProduct } from '@/lib/api';

const place = (product: ApiProduct): string =>
  `product ${String(product.sku ?? '').trim() || '(missing sku)'}`;

export const catalogProblems = (catalog: ApiCatalog): string[] => {
  const problems: string[] = [];
  const slugs = new Set<string>();
  const categoryIds = new Set(catalog.categories.map((category) => category.id));

  if (catalog.products.length === 0) problems.push('the catalogue has no products');

  for (const product of catalog.products) {
    const where = place(product);

    if (!String(product.sku ?? '').trim()) problems.push(`${where}: sku is empty`);
    if (!String(product.name ?? '').trim()) problems.push(`${where}: name is empty`);

    const slug = String(product.slug ?? '').trim();
    if (!slug) problems.push(`${where}: slug is empty`);
    else if (slugs.has(slug)) problems.push(`${where}: slug "${slug}" is used twice`);
    else slugs.add(slug);

    if (!(Number(product.price) > 0)) problems.push(`${where}: price must be greater than zero`);

    if (product.quantity !== null && (!Number.isInteger(product.quantity) || product.quantity < 0)) {
      problems.push(`${where}: quantity must be a whole number, zero or more`);
    }

    if (!categoryIds.has(product.category_id)) problems.push(`${where}: category does not exist`);

    if (!/^https?:\/\//i.test(String(product.image?.url ?? ''))) {
      problems.push(`${where}: image is missing`);
    }

    if (
      product.sale_price !== null &&
      !(product.sale_price > 0 && product.sale_price < product.regular_price)
    ) {
      problems.push(`${where}: sale price must sit below the regular price`);
    }
  }

  return problems;
};
