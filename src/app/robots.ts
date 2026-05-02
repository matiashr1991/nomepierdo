import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app/', '/dashboard/', '/admin/', '/p/'],
    },
    sitemap: 'https://nomepierdo.com/sitemap.xml',
  };
}
