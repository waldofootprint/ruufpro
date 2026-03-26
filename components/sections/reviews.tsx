// Reviews section — shows customer testimonials with star ratings.
// Hidden entirely if the roofer hasn't added any reviews yet.
// V1.1 will auto-pull from Google.

import type { Review } from "@/lib/types";

interface ReviewsProps {
  reviews: Review[];
}

export default function Reviews({ reviews }: ReviewsProps) {
  // Don't render if no reviews
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          What Our Customers Say
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="rounded-lg bg-white p-6 border border-gray-200"
            >
              {/* Star rating */}
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-5 w-5 ${
                      star <= review.rating
                        ? "text-yellow-400"
                        : "text-gray-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                "{review.text}"
              </p>
              <p className="text-sm font-semibold text-gray-900">
                — {review.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
