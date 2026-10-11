import { isOutOfStock, type Category, type Product } from '@/lib/catalog';

/**
 * Structured data for a product page. Google reads this to show price and
 * availability in results, so it only repeats what the page already says.
 */
export const productSchema = (
  product: Product,
  context: { url: string; image?: string; category?: Category | null }
) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  sku: product.sku,
  image: context.image ? [context.image] : undefined,
  category: context.category?.name,
  brand: { '@type': 'Brand', name: 'وقار' },
  offers: {
    '@type': 'Offer',
    url: context.url,
    price: product.price,
    priceCurrency: 'SAR',
    availability: isOutOfStock(product)
      ? 'https://schema.org/OutOfStock'
      : 'https://schema.org/InStock',
  },
});
