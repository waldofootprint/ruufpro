// Contact form — captures leads from homeowners.
// Submits to Supabase via the anon client (public insert is allowed by RLS).
// This is "use client" because it has form state and event handlers.

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ContactFormProps {
  contractorId: string;
  siteId: string;
  phone: string;
  city: string;
  state: string;
  address: string | null;
}

export default function ContactForm({
  contractorId,
  siteId,
  phone,
  city,
  state,
  address,
}: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: insertError } = await supabase.from("leads").insert({
      contractor_id: contractorId,
      site_id: siteId,
      name,
      email: email || null,
      phone: phoneInput || null,
      message: message || null,
      source: "contact_form",
    });

    if (insertError) {
      setError("Something went wrong. Please call us instead.");
      setLoading(false);
      return;
    }

    // Send email notification to the contractor
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractor_id: contractorId,
        lead_name: name,
        lead_phone: phoneInput,
        lead_email: email,
        lead_message: message,
        source: "contact_form",
      }),
    }).catch(() => {});

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section id="contact" className="py-16 md:py-20 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-lg text-gray-600 mb-4">
            We received your message and will be in touch shortly.
          </p>
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            className="text-brand-600 font-semibold hover:underline"
          >
            Or call us now: {phone}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-16 md:py-20 bg-gray-50">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left side — contact info */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Get Your Free Inspection
            </h2>
            <p className="text-gray-600 mb-6">
              Fill out the form or give us a call. We respond fast.
            </p>

            <div className="space-y-4">
              <a
                href={`tel:${phone.replace(/\D/g, "")}`}
                className="flex items-center gap-3 text-lg font-semibold text-brand-600 hover:underline"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {phone}
              </a>

              {address && (
                <p className="text-gray-600">
                  {address}, {city}, {state}
                </p>
              )}
            </div>
          </div>

          {/* Right side — form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <input
              type="text"
              required
              placeholder="Your Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            <textarea
              placeholder="How can we help?"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-gray-800 hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
