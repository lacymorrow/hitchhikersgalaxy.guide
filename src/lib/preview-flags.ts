import "server-only";
import { cookies } from "next/headers";
import { buildTimeFeatures, featureFlagNames } from "@/config/features-config";

export const PREVIEW_COOKIE = "_shipkit_preview";

const TRUTHY = new Set(["1", "true", "on", "yes", "enable", "enabled"]);
const FALSY = new Set(["0", "false", "off", "no", "disable", "disabled"]);

export const QUERY_PARAM_PREFIX = "feature_flag_";

export type FeatureFlagOverrides = Record<string, boolean>;

function flagNameToParamKey(flagName: string): string {
  return `${QUERY_PARAM_PREFIX}${flagName.replace(/_ENABLED$/, "").toLowerCase()}`;
}

function paramKeyToFlagName(paramKey: string): string | undefined {
  if (!paramKey.startsWith(QUERY_PARAM_PREFIX)) return undefined;
  const suffix = `${paramKey.slice(QUERY_PARAM_PREFIX.length).toUpperCase()}_ENABLED`;
  return featureFlagNames.includes(suffix) ? suffix : undefined;
}

export function parseTruthy(value: string): boolean | undefined {
  const v = value.toLowerCase().trim();
  if (TRUTHY.has(v)) return true;
  if (FALSY.has(v)) return false;
  return undefined;
}

const validFlagNames = new Set(featureFlagNames);

function parseOverridesCookie(raw: string): FeatureFlagOverrides {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  const result: FeatureFlagOverrides = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value === "boolean" && validFlagNames.has(key)) result[key] = value;
  }
  return result;
}

export async function getOverrides(): Promise<FeatureFlagOverrides> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(PREVIEW_COOKIE)?.value;
    if (!raw) return {};
    return parseOverridesCookie(raw);
  } catch {
    return {};
  }
}

export async function isFeatureEnabledWithOverrides(flagName: string): Promise<boolean> {
  const overrides = await getOverrides();
  if (flagName in overrides) return overrides[flagName]!;
  return buildTimeFeatures[flagName] ?? false;
}

export function parseOverridesFromParams(searchParams: URLSearchParams): FeatureFlagOverrides {
  const overrides: FeatureFlagOverrides = {};
  for (const [key, value] of searchParams.entries()) {
    const flagName = paramKeyToFlagName(key);
    if (!flagName) continue;
    const parsed = parseTruthy(value);
    if (parsed !== undefined) {
      overrides[flagName] = parsed;
    }
  }
  return overrides;
}

export function getAllFlagParamKeys(): Record<string, string> {
  return Object.fromEntries(featureFlagNames.map((name) => [name, flagNameToParamKey(name)]));
}
