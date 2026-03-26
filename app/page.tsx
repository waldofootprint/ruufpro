export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-brand-900 mb-4">RoofReady</h1>
      <p className="text-xl text-gray-600 mb-8 text-center max-w-xl">
        Professional roofing websites in minutes. Free.
        <br />
        Add an instant estimate widget for $99/mo.
      </p>
      <a
        href="/signup"
        className="rounded-md bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Get Your Free Website
      </a>
      <p className="mt-4 text-sm text-gray-500">
        Already have an account?{" "}
        <a href="/login" className="text-brand-600 hover:underline">
          Sign in
        </a>
      </p>
    </main>
  );
}
