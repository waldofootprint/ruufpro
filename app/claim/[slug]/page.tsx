// Claim flow is temporarily closed. No form is rendered, no auth call is wired.

export default async function ClaimPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Signups are closed
        </h1>
        <p className="text-gray-600 text-sm">
          RuufPro isn&apos;t accepting new accounts right now. We&apos;re
          finalizing the product and will reopen soon.
        </p>
        <p className="text-sm text-gray-500">
          Want to be notified? Email{" "}
          <a
            href="mailto:hannah@getruufpro.com"
            className="text-gray-900 underline"
          >
            hannah@getruufpro.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
