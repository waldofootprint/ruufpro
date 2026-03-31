// robots.txt — tells search engines what to crawl and what to skip.
// Dashboard, auth, and API routes are excluded from indexing.

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/login/",
          "/signup/",
          "/onboarding/",
          "/api/",
          "/preview/",
          "/widget-preview/",
        ],
      },
    ],
    sitemap: "https://ruufpro.com/sitemap.xml",
  };
}
