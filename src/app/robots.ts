import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/mano', '/auth/', '/prisijungti'] },
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
