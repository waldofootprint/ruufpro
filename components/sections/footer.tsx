// Footer — business info + "Powered by RoofReady" link.
// The "Powered by" link is our organic growth engine — every free site
// advertises RoofReady to visitors.

interface FooterProps {
  businessName: string;
  phone: string;
  city: string;
  state: string;
  address: string | null;
  licenseNumber: string | null;
}

export default function Footer({
  businessName,
  phone,
  city,
  state,
  address,
  licenseNumber,
}: FooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="font-semibold text-white">{businessName}</p>
            <p className="text-sm">
              {address ? `${address}, ` : ""}
              {city}, {state}
            </p>
            <a
              href={`tel:${phone.replace(/\D/g, "")}`}
              className="text-sm hover:text-white transition-colors"
            >
              {phone}
            </a>
            {licenseNumber && (
              <p className="text-xs mt-1">License #{licenseNumber}</p>
            )}
          </div>

          <div className="text-sm">
            Powered by{" "}
            <a
              href="https://roofready.com"
              className="text-brand-500 hover:text-brand-400 transition-colors"
            >
              RoofReady
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
