import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import { getPublishedProduct, listPublishedProducts } from '@/lib/services/catalog';

export const CATALOG_TAG = 'catalog';

export async function getCatalog() {
  'use cache';
  cacheTag(CATALOG_TAG);
  cacheLife('hours');
  return listPublishedProducts();
}

export async function getCatalogProduct(slug: string) {
  'use cache';
  cacheTag(CATALOG_TAG);
  cacheLife('hours');
  return getPublishedProduct(slug);
}
