// Vercel Domains API client — add/remove/verify custom domains.
// Uses the Vercel REST API. Requires VERCEL_PROJECT_ID and VERCEL_API_TOKEN.

const VERCEL_API = "https://api.vercel.com";

function headers() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

const projectId = () => process.env.VERCEL_PROJECT_ID!;

export interface DomainInfo {
  name: string;
  verified: boolean;
  verification?: { type: string; domain: string; value: string }[];
  configured: boolean;
}

// Add a custom domain to the Vercel project.
export async function addDomain(domain: string): Promise<{ ok: boolean; error?: string; domain?: DomainInfo }> {
  const res = await fetch(`${VERCEL_API}/v10/projects/${projectId()}/domains`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name: domain }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { ok: false, error: data.error?.message || "Failed to add domain" };
  }

  return {
    ok: true,
    domain: {
      name: data.name,
      verified: data.verified ?? false,
      verification: data.verification,
      configured: data.configured ?? false,
    },
  };
}

// Remove a custom domain from the Vercel project.
export async function removeDomain(domain: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${VERCEL_API}/v9/projects/${projectId()}/domains/${domain}`, {
    method: "DELETE",
    headers: headers(),
  });

  if (!res.ok) {
    const data = await res.json();
    return { ok: false, error: data.error?.message || "Failed to remove domain" };
  }

  return { ok: true };
}

// Get domain configuration + verification status.
export async function getDomainConfig(domain: string): Promise<DomainInfo | null> {
  const res = await fetch(`${VERCEL_API}/v6/domains/${domain}/config`, {
    headers: headers(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    name: domain,
    verified: !data.misconfigured,
    configured: !data.misconfigured,
  };
}

// Verify a domain (trigger DNS verification check).
export async function verifyDomain(domain: string): Promise<{ ok: boolean; verified: boolean; error?: string }> {
  const res = await fetch(`${VERCEL_API}/v9/projects/${projectId()}/domains/${domain}/verify`, {
    method: "POST",
    headers: headers(),
  });

  const data = await res.json();

  if (!res.ok) {
    return { ok: false, verified: false, error: data.error?.message || "Verification failed" };
  }

  return { ok: true, verified: data.verified ?? false };
}
