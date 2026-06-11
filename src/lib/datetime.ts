const EASTERN = "America/New_York";

export function formatEasternDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: EASTERN,
    dateStyle: "medium",
    timeStyle: "short",
  });
}
