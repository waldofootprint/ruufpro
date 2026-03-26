// Service area section — tells homeowners where this roofer works.
// Auto-generated from the city field. Roofer can add more cities later.

interface ServiceAreaProps {
  city: string;
  state: string;
  additionalCities: string[] | null;
}

export default function ServiceArea({
  city,
  state,
  additionalCities,
}: ServiceAreaProps) {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Service Area
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          Proudly serving {city}, {state} and surrounding areas
        </p>
        {additionalCities && additionalCities.length > 0 && (
          <p className="text-gray-500">
            Also serving: {additionalCities.join(", ")}
          </p>
        )}
      </div>
    </section>
  );
}
