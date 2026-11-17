import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/superadmin/', '/admin/', '/api/'],
      },
    ],
    sitemap: 'https://cafe.abstech.web.id/sitemap.xml',
  };
}
