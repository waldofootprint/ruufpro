// Property Intelligence Card — shows enriched property data for a lead.
// Displayed inline on the lead card when data is available,
// or shows a "Get Property Intel" button when not yet fetched.

"use client";

import { useState } from "react";
import {
  Home, Calendar, Ruler, DollarSign, User, ArrowUpRight,
  Layers, Search, AlertCircle, CheckCircle2,
} from "lucide-react";
import type { PropertyData } from "@/lib/rentcast-api";

interface PropertyIntelCardProps {
  leadId: string;
  address: string | null;
  initialData: PropertyData | null;
  onDataFetched?: (data: PropertyData) => void;
}

export default function PropertyIntelCard({
  leadId,
  address,
  initialData,
  onDataFetched,
}: PropertyIntelCardProps) {
  const [data, setData] = useState<PropertyData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFetch() {
    if (!address) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/property-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, address }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to fetch property data");
        setLoading(false);
        return;
      }

      const result = await res.json();
      setData(result);
      onDataFetched?.(result);
    } catch {
      setError("Network error — try again");
    }
    setLoading(false);
  }

  // No address available
  if (!address) {
    return (
      <div className="bg-slate-50 rounded-lg p-3">
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          No address on file — property intel unavailable
        </p>
      </div>
    );
  }

  // Not yet fetched — show fetch button
  if (!data) {
    return (
      <div className="bg-slate-50 rounded-lg p-3">
        <button
          onClick={handleFetch}
          disabled={loading}
          className="flex items-center gap-2 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
        >
          <Search className="w-3.5 h-3.5" />
          {loading ? "Looking up property..." : "Get Property Intel"}
        </button>
        {error && (
          <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
        <p className="text-[9px] text-slate-300 mt-1">Uses 2 RentCast API credits</p>
      </div>
    );
  }

  // Data loaded — show intel
  const currentYear = new Date().getFullYear();
  const roofAge = data.year_built ? currentYear - data.year_built : null;
  const saleHistory = Object.entries(data.sale_history || {})
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 3);

  return (
    <div className="bg-slate-50 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Property Intel
        </p>
        {data.formatted_address && (
          <p className="text-[9px] text-slate-300 truncate max-w-[180px]">{data.formatted_address}</p>
        )}
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Year Built + Roof Age */}
        {data.year_built && (
          <div className="bg-white rounded-lg p-2 border border-slate-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="text-[9px] text-slate-400 uppercase">Built</span>
            </div>
            <p className="text-[13px] font-bold text-slate-800">{data.year_built}</p>
            {roofAge !== null && (
              <p className={`text-[9px] font-semibold ${roofAge > 20 ? "text-red-500" : roofAge > 15 ? "text-amber-500" : "text-emerald-500"}`}>
                {roofAge > 20 ? `${roofAge}yr old — likely needs replacement` :
                 roofAge > 15 ? `${roofAge}yr old — aging roof` :
                 `${roofAge}yr old`}
              </p>
            )}
          </div>
        )}

        {/* Square Footage */}
        {data.square_footage && (
          <div className="bg-white rounded-lg p-2 border border-slate-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Ruler className="w-3 h-3 text-slate-400" />
              <span className="text-[9px] text-slate-400 uppercase">Size</span>
            </div>
            <p className="text-[13px] font-bold text-slate-800">{data.square_footage.toLocaleString()} sqft</p>
            {data.bedrooms && data.bathrooms && (
              <p className="text-[9px] text-slate-400">{data.bedrooms}bd / {data.bathrooms}ba</p>
            )}
          </div>
        )}

        {/* Estimated Value */}
        {data.estimated_value && (
          <div className="bg-white rounded-lg p-2 border border-slate-100">
            <div className="flex items-center gap-1 mb-0.5">
              <DollarSign className="w-3 h-3 text-slate-400" />
              <span className="text-[9px] text-slate-400 uppercase">Value</span>
            </div>
            <p className="text-[13px] font-bold text-slate-800">${(data.estimated_value / 1000).toFixed(0)}K</p>
            {data.value_range_low && data.value_range_high && (
              <p className="text-[9px] text-slate-400">
                ${(data.value_range_low / 1000).toFixed(0)}K – ${(data.value_range_high / 1000).toFixed(0)}K
              </p>
            )}
          </div>
        )}

        {/* Property Type */}
        {data.property_type && (
          <div className="bg-white rounded-lg p-2 border border-slate-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Home className="w-3 h-3 text-slate-400" />
              <span className="text-[9px] text-slate-400 uppercase">Type</span>
            </div>
            <p className="text-[13px] font-bold text-slate-800">{data.property_type}</p>
            {data.stories && <p className="text-[9px] text-slate-400">{data.stories} {data.stories === 1 ? "story" : "stories"}</p>}
          </div>
        )}

        {/* Roof Type — highlighted since we're a roofing app */}
        {data.roof_type && (
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
            <div className="flex items-center gap-1 mb-0.5">
              <Layers className="w-3 h-3 text-blue-400" />
              <span className="text-[9px] text-blue-400 uppercase font-semibold">Current Roof</span>
            </div>
            <p className="text-[13px] font-bold text-blue-700">{data.roof_type}</p>
            {roofAge !== null && (
              <p className="text-[9px] text-blue-400">~{roofAge} years old</p>
            )}
          </div>
        )}

        {/* Owner */}
        {data.owner_names && data.owner_names.length > 0 && (
          <div className="bg-white rounded-lg p-2 border border-slate-100">
            <div className="flex items-center gap-1 mb-0.5">
              <User className="w-3 h-3 text-slate-400" />
              <span className="text-[9px] text-slate-400 uppercase">Owner</span>
            </div>
            <p className="text-[13px] font-bold text-slate-800 truncate">{data.owner_names[0]}</p>
            <p className="text-[9px] text-slate-400">
              {data.owner_occupied ? "Owner-occupied" : "Not owner-occupied"}
            </p>
          </div>
        )}
      </div>

      {/* Last Sale */}
      {data.last_sale_price && data.last_sale_date && (
        <div className="bg-white rounded-lg p-2 border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
              <span className="text-[9px] text-slate-400 uppercase">Last Sale</span>
            </div>
            <span className="text-[9px] text-slate-400">
              {new Date(data.last_sale_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </span>
          </div>
          <p className="text-[13px] font-bold text-slate-800 mt-0.5">
            ${data.last_sale_price.toLocaleString()}
          </p>
          {/* Additional sale history */}
          {saleHistory.length > 1 && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-50">
              {saleHistory.slice(1).map(([date, info]: [string, any]) => (
                <p key={date} className="text-[9px] text-slate-400">
                  {new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  {info.price ? ` — $${info.price.toLocaleString()}` : ""}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tax data */}
      {(data.tax_assessed_value || data.annual_property_tax) && (
        <div className="flex gap-2">
          {data.tax_assessed_value && (
            <div className="flex-1 bg-white rounded-lg p-2 border border-slate-100">
              <span className="text-[9px] text-slate-400 uppercase">Tax Assessed</span>
              <p className="text-[12px] font-bold text-slate-800">${(data.tax_assessed_value / 1000).toFixed(0)}K</p>
            </div>
          )}
          {data.annual_property_tax && (
            <div className="flex-1 bg-white rounded-lg p-2 border border-slate-100">
              <span className="text-[9px] text-slate-400 uppercase">Annual Tax</span>
              <p className="text-[12px] font-bold text-slate-800">${data.annual_property_tax.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      <p className="text-[8px] text-slate-300 italic">
        Source: Public records via RentCast · Fetched {new Date(data.fetched_at).toLocaleDateString()}
      </p>
    </div>
  );
}
