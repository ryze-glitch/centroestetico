export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const origin = env.ALLOW_ORIGIN || "https://ryze-glitch.github.io";
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (url.pathname === "/health") {
      return json({ ok: true, ts: Date.now() }, 200, origin);
    }

    if (url.pathname === "/login" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const username = String(body.username || "").trim();
      const pin = String(body.pin || "").trim();

      if (!username || !pin) return json({ ok: false, error: "Missing fields" }, 400, origin);

      if (pin !== env.ADMIN_PIN) {
        await sendDiscord(env, {
          type: "LOGIN_FAIL",
          username,
          ip: getIp(request),
          cf: request.cf || null
        });
        return json({ ok: false, error: "Invalid credentials" }, 401, origin);
      }

      const exp = Date.now() + 1000 * 60 * 60 * 12; // 12h
      const token = await signToken(env, { u: username, exp });

      await sendDiscord(env, {
        type: "LOGIN_OK",
        username,
        ip: getIp(request),
        cf: request.cf || null
      });

      return json({ ok: true, token, exp }, 200, origin);
    }

    if (url.pathname === "/event" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      const claims = token ? await verifyToken(env, token) : null;

      if (!claims || claims.exp < Date.now()) {
        return json({ ok: false, error: "Unauthorized" }, 401, origin);
      }

      const body = await request.json().catch(() => ({}));
      const action = String(body.action || "").slice(0, 80);
      const details = String(body.details || "").slice(0, 300);

      await sendDiscord(env, {
        type: "EVENT",
        username: claims.u,
        action,
        details,
        ip: getIp(request),
        cf: request.cf || null
      });

      return json({ ok: true }, 200, origin);
    }

    return json({ ok: false, error: "Not found" }, 404, origin);
  }
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin)
    }
  });
}

function getIp(request) {
  // In Cloudflare prod l'IP cliente è tipicamente in CF-Connecting-IP [web:191]
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")
    || "unknown";
}

function formatLocation(cf) {
  if (!cf) return "n/a";
  const parts = [cf.country, cf.region, cf.city].filter(Boolean);
  return parts.length ? parts.join(" / ") : "n/a";
}

async function sendDiscord(env, data) {
  if (!env.DISCORD_WEBHOOK_URL) return;

  const loc = formatLocation(data.cf);
  const ua = data.ua || "";

  const lines = [
    `**Type:** ${data.type}`,
    data.username ? `**User:** ${data.username}` : null,
    data.action ? `**Action:** ${data.action}` : null,
    data.details ? `**Details:** ${data.details}` : null,
    `**IP:** ${data.ip}`,
    `**Location:** ${loc}`,
    ua ? `**UA:** ${ua.slice(0, 160)}` : null,
    `**TS:** ${new Date().toISOString()}`
  ].filter(Boolean).join("\n");

  const payload = { content: lines }; // Discord webhook payload [web:199]

  await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function signToken(env, claims) {
  const raw = new TextEncoder().encode(JSON.stringify(claims));
  const sig = await hmac(env, raw);
  return base64url(raw) + "." + base64url(sig);
}

async function verifyToken(env, token) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const raw = base64urlToBytes(parts[0]);
  const sig = base64urlToBytes(parts[1]);
  const expSig = await hmac(env, raw);

  if (!timingSafeEqual(sig, expSig)) return null;

  try {
    return JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return null;
  }
}

async function hmac(env, messageBytes) {
  const keyBytes = new TextEncoder().encode(env.SIGNING_SECRET);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, messageBytes);
  return new Uint8Array(sig);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= (a[i] ^ b[i]);
  return out === 0;
}

function base64url(bytes) {
  let str = "";
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

