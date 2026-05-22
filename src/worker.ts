/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export type Bindings = {
  patungan: KVNamespace;
  vpsai: R2Bucket;
  ASSETS?: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

const API_KEY = "cutad_98e7ba3c88fdfe5526740ed69f59fc71267f4a69";
const BASE_URL = "https://www.cutad.web.id/api/public";

// --- EXTERNAL STREAMING API ---
app.get("/api/providers", async (c) => {
  try {
    const response = await fetch(`${BASE_URL}?key=${API_KEY}`);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    return c.json({ error: "Failed to fetch providers" }, 500);
  }
});

app.get("/api/search/:provider", async (c) => {
  try {
    const provider = c.req.param("provider");
    const q = c.req.query("q") || "";
    const url = `${BASE_URL}/${provider}?action=search&q=${encodeURIComponent(q)}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    return c.json({ error: "Failed to search" }, 500);
  }
});

app.get("/api/rank/:provider", async (c) => {
  try {
    const provider = c.req.param("provider");
    const url = `${BASE_URL}/${provider}?action=rank&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    return c.json({ error: "Failed to fetch rank" }, 500);
  }
});

app.get("/api/episodes/:provider", async (c) => {
  try {
    const provider = c.req.param("provider");
    const id = c.req.query("id") || "";
    const url = `${BASE_URL}/${provider}?action=episodes&id=${encodeURIComponent(id)}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    return c.json({ error: "Failed to fetch episodes" }, 500);
  }
});

app.get("/api/stream/:provider", async (c) => {
  try {
    const provider = c.req.param("provider");
    const id = c.req.query("id") || "";
    const url = `${BASE_URL}/${provider}?action=stream&id=${encodeURIComponent(id)}&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    return c.json({ error: "Failed to fetch stream" }, 500);
  }
});

// --- PROXY API (Cloudflare Worker Implementation) ---
app.get("/api/proxy/m3u8", async (c) => {
  try {
    const url = c.req.query("url");
    const referer = c.req.query("referer");
    const origin = c.req.query("origin");

    if (!url) return c.json({ error: "URL is required" }, 400);

    const headers: Record<string, string> = {};
    if (referer) headers["Referer"] = referer;
    if (origin) headers["Origin"] = origin;

    const response = await fetch(url, { headers });
    if (!response.ok) return c.text(`Failed to proxy: ${response.statusText}`, response.status as any);

    const newResponse = new Response(response.body, response);
    const contentType = response.headers.get("content-type");
    if (contentType) newResponse.headers.set("Content-Type", contentType);
    
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    newResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");

    if (url.includes(".m3u8")) {
      let text = await response.text();
      const baserUrlObj = new URL(url);
      const basePath = url.substring(0, url.lastIndexOf("/") + 1);

      const rewriteUrl = (rawUrl: string) => {
        let absoluteUrl = rawUrl;
        if (!absoluteUrl.startsWith("http")) {
          if (absoluteUrl.startsWith("/")) absoluteUrl = `${baserUrlObj.origin}${absoluteUrl}`;
          else absoluteUrl = `${basePath}${absoluteUrl}`;
        }
        return `/api/proxy/m3u8?url=${encodeURIComponent(absoluteUrl)}` + 
               (referer ? `&referer=${encodeURIComponent(referer)}` : "") +
               (origin ? `&origin=${encodeURIComponent(origin)}` : "");
      };

      const rewritten = text.split("\n").map(line => {
        let trimmed = line.trim();
        if (trimmed === "") return line;
        if (trimmed.startsWith("#")) {
          return trimmed.replace(/URI="([^"]+)"/g, (_, p1) => `URI="${rewriteUrl(p1)}"`);
        }
        return rewriteUrl(trimmed);
      }).join("\n");

      return c.text(rewritten, 200, {
        "Content-Type": contentType || "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      });
    }

    return newResponse;
  } catch (error) {
    return c.json({ error: "Proxy failed" }, 500);
  }
});

app.get("/api/proxy/vtt", async (c) => {
  try {
    const url = c.req.query("url");
    if (!url) return c.json({ error: "URL is required" }, 400);

    const response = await fetch(url);
    if (!response.ok) return c.text("Failed to fetch subtitle", response.status as any);

    let text = await response.text();
    if (!text.startsWith("WEBVTT")) {
      text = "WEBVTT\n\n" + text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    }

    return c.text(text, 200, {
      "Content-Type": "text/vtt",
      "Access-Control-Allow-Origin": "*"
    });
  } catch (error) {
    return c.json({ error: "Subtitle proxy failed" }, 500);
  }
});

app.get("/api/download", (c) => {
  return c.text("Fitur download dinonaktifkan di Cloudflare Worker karena limitasi ffmpeg.", 403);
});


// --- PROFILE & ADMIN API ---
app.use("*", async (c, next) => {
  // Local environment polyfill for preview
  if (!c.env) c.env = {} as Bindings;
  await next();
});

app.get("/api/profile", async (c) => {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || 'Unknown';
  let userId = c.req.header("X-User-ID") || ip;
  const userAgent = c.req.header("User-Agent") || 'Unknown';
  
  // Try to get from KV
  let limit = 10; // default free limit
  let id = userId.startsWith('UID-') ? userId : `USER-${ip.replace(/[^0-9]/g, '').substring(0,4)}`;
  let type = 'free';
  
  if (c.env.patungan) {
    const data = await c.env.patungan.get(`user_${userId}`, "json") as any;
    if (data) {
      limit = data.limit;
      id = data.id || id;
      type = data.type || 'free';
    } else {
      await c.env.patungan.put(`user_${userId}`, JSON.stringify({ id, limit, type }));
    }
  }

  return c.json({
    id,
    ip,
    userAgent,
    limit,
    type
  });
});

app.post("/api/consume-limit", async (c) => {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || 'Unknown';
  let userId = c.req.header("X-User-ID") || ip;
  
  let limit = 10;
  let id = userId.startsWith('UID-') ? userId : `USER-${ip.replace(/[^0-9]/g, '').substring(0,4)}`;
  let type = 'free';

  if (c.env.patungan) {
    const data = await c.env.patungan.get(`user_${userId}`, "json") as any;
    if (data) {
      limit = data.limit;
      id = data.id || id;
      type = data.type || 'free';
    }
    
    // Allow unlimited if limit string is 999999 or VIP
    if (limit <= 0 && type !== 'VIP') {
      return c.json({ allowed: false, limit: 0, message: "Limit reached" });
    }

    if (type !== 'VIP') {
      limit -= 1;
      await c.env.patungan.put(`user_${userId}`, JSON.stringify({ id, limit, type }));
    }
  }

  return c.json({ allowed: true, limit, type });
});
app.post("/api/create-payment", async (c) => {
  try {
    const body = await c.req.json();
    const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || 'Unknown';
    const userId = c.req.header("X-User-ID") || ip;
    
    let apiKey = "sk_test_seryG3U0IrU56SzFIczQuZ4ycA5iWJ6H"; // Default
    if (c.env.patungan) {
      const storedKey = await c.env.patungan.get("paymenku_api_key");
      if (storedKey) apiKey = storedKey;
    }

    const userIdStr = userId.replace(/[^a-zA-Z0-9-]/g, '_');
    const invId = `INV-${Date.now()}-${userIdStr}`;

    const payload = {
      reference_id: invId,
      amount: body.amount || 100000,
      customer_name: body.customer_name || "Guest",
      customer_email: body.customer_email || "guest@example.com",
      channel_code: "qris",
      return_url: "https://patungantv.com/payment-done" // Ganti dengan domain asli
    };

    const response = await fetch("https://paymenku.com/api/v1/transaction/create", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to create payment" }, 500);
  }
});

app.post("/api/payment-callback", async (c) => {
  try {
    const body = await c.req.json();
    
    // Webhook Paymenku mengirimkan status
    // Cek dokumentasi Paymenku untuk list status sukses. Umumnya SUCCESS, SETTLED, PAID
    if (body.status === 'SUCCESS' || body.status === 'SETTLED' || body.transaction_status === 'settlement' || body.status === 'PAID') {
       const ref_id = body.reference_id || "";
       const parts = ref_id.split('-');
       if (parts.length >= 3) {
         const userIdStr = parts.slice(2).join('-');
         
         if (c.env.patungan) {
           let data = await c.env.patungan.get(`user_${userIdStr}`, "json") as any;
           if (!data) data = { id: userIdStr.startsWith('UID-') ? userIdStr : `USER-${userIdStr.substring(0,4)}` };
           
           data.limit = 999999; // Unlimited
           data.type = "VIP";
           
           await c.env.patungan.put(`user_${userIdStr}`, JSON.stringify(data));
         }
       }
    }
  } catch(e) {}
  return c.json({ received: true });
});

app.post("/api/admin/settings", async (c) => {
  const body = await c.req.json();
  if (c.env.patungan) {
    if (body.paymenku_api_key) {
      await c.env.patungan.put("paymenku_api_key", body.paymenku_api_key);
    }
  }
  return c.json({ success: true });
});

app.get('*', async (c) => {
  if (c.env.ASSETS) {
    // Cloudflare Workers statically serves files directly. 
    // This fallback catches unmatched routes and returns the index.html for SPA routing.
    return c.env.ASSETS.fetch(new Request(new URL('/', c.req.url), c.req.raw));
  }
  return c.text('Not found', 404);
});

export default app;
