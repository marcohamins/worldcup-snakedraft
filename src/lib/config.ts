export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

export function withBasePath(path: string): string {
  const base = getBasePath();
  if (!base) {
    return path;
  }
  return `${base}${path}`;
}
