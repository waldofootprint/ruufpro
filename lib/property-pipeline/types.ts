export type PipelineStatus = "active" | "engaged" | "suppressed" | "cooled";
export type PipelineTier = "hot" | "warm" | "cool" | null;

export interface PipelineCandidate {
  id: string;
  parcel_id: string;
  address_raw: string;
  city: string;
  zip: string;
  year_built: number;
  assessed_value: number | null;
  status: PipelineStatus;
  score: number | null;
  tier: PipelineTier;
  score_factors: Record<string, unknown>;
}

export interface ZipAggregate {
  zip: string;
  count: number;
}
