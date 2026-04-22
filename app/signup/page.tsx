// Signup is temporarily closed. This page intentionally renders no form —
// no auth call is wired up while we finalize the product.

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">
          Signups are closed
        </h1>
        <p className="text-slate-600">
          RuufPro isn't accepting new accounts right now. We're finalizing the
          product and will reopen signups soon.
        </p>
        <p className="text-sm text-slate-500">
          Want to be notified? Email{" "}
          <a
            href="mailto:hannah@getruufpro.com"
            className="text-slate-900 underline"
          >
            hannah@getruufpro.com
          </a>
          .
        </p>
        <a
          href="/"
          className="inline-block mt-4 text-sm text-slate-500 hover:text-slate-900"
        >
          ← Back to home
        </a>
      </div>
    </div>
  );
}
