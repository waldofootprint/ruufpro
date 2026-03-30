/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is the key to multi-tenant subdomain routing.
  // In production, requests to "joes-roofing.ruufpro.com" get rewritten
  // to our app, and we read the subdomain to look up the right contractor's site.
  // For local development, we'll use "joes-roofing.localhost:3000" instead.
};

module.exports = nextConfig;
