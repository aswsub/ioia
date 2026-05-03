type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  path?: string;
  maxAge?: number;
  expires?: Date;
};

export function parseCookies(req: { headers?: { cookie?: string } }) {
  const header = req.headers?.cookie ?? "";
  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) return acc;
    acc[rawName] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  parts.push(`Path=${options.path ?? "/"}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  parts.push(`SameSite=${options.sameSite ?? "Lax"}`);
  return parts.join("; ");
}

export function appendSetCookie(res: { getHeader?: (name: string) => unknown; setHeader: (name: string, value: string | string[]) => void }, cookie: string) {
  const existing = res.getHeader?.("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookie);
    return;
  }
  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing.map(String), cookie]);
    return;
  }
  res.setHeader("Set-Cookie", [String(existing), cookie]);
}

export function clearCookie(name: string) {
  return serializeCookie(name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 0,
  });
}
