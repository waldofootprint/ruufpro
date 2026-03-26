// Services grid — shows what the roofer does.
// Auto-populated from business type defaults, roofer can customize later.

interface Service {
  name: string;
  description: string;
}

interface ServicesGridProps {
  services: Service[];
}

export default function ServicesGrid({ services }: ServicesGridProps) {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Our Services
        </h2>
        <p className="text-gray-500 text-center mb-12">
          Professional solutions for every roofing need
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.name}
              className="rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {service.name}
              </h3>
              {service.description && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
