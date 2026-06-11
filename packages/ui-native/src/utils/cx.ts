/** Join truthy class-name parts with spaces (NativeWind className composition). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
