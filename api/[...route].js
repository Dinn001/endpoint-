// ======================
// 🆔 RANDOM ID
// ======================
function generateId(length = 16) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ======================
// 📦 RESPONSE FORMAT
// ======================
function sendResponse(res, category, endpoint, model, data, ping = null) {
  return res.json({
    success: true,
    api: "Dinns API",
    base_url: "https://endpoint-dinns.vercel.app",
    category,
    endpoint,
    model: model || null,
    author: "@dinns",
    request_id: generateId(),
    ping_ms: ping,
    data
  });
}

// ======================
// 🌐 FETCH HTML (SCRAPE)
// ======================
async function fetchHTML(url, timeout = 14000) {
  const start = Date.now();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36"
      }
    });

    const html = await res.text();

    return { success: true, data: html, ping: Date.now() - start };

  } catch (err) {
    return {
      success: false,
      error:
        err.name === "AbortError"
          ? "Request timeout (>14s)"
          : err.message,
      ping: Date.now() - start
    };
  } finally {
    clearTimeout(id);
  }
}

// ======================
// ⏱ FETCH JSON
// ======================
async function fetchJSON(url, timeout = 14000) {
  const start = Date.now();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();

    return { success: true, data, ping: Date.now() - start };

  } catch (err) {
    return {
      success: false,
      error:
        err.name === "AbortError"
          ? "Request timeout (>14s)"
          : err.message,
      ping: Date.now() - start
    };
  } finally {
    clearTimeout(id);
  }
}

// ======================
// 🚀 HANDLER
// ======================
export default async function handler(req, res) {
  try {

    const { apikey } = req.query;
    if (apikey !== "dinns_key") {
      return res.status(403).json({
        success: false,
        error: "Invalid API key"
      });
    }

    const pathname = req.url.split("?")[0];
    const path = pathname.replace(/^\/api\//, "").split("/").filter(Boolean);

    const category = path[0] || "unknown";
    const name = path[1] || "unknown";

    // ===================================================
    // 🤖 AI CHAT (LOCAL)
    // ===================================================
    if (category === "ai" && name === "chat") {
      const { q } = req.query;
      return sendResponse(
        res,
        "ai",
        "chat",
        "Dinns AI",
        { reply: `Halo! Kamu bilang: ${q || ""}` },
        0
      );
    }

    // ===================================================
    // 🤖 CICI
    // ===================================================
    if (category === "ai" && name === "cici") {
      const { prompt } = req.query;

      const r = await fetchJSON(
        `https://anabot.my.id/api/ai/cici?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);

      return sendResponse(
        res,
        "ai",
        "cici",
        "Dinns AI",
        r.data?.data?.result,
        r.ping
      );
    }

    // ===================================================
    // 🧠 PERPLEXITY
    // ===================================================
    if (category === "ai" && name === "perplexity") {
      const { prompt } = req.query;

      const r = await fetchJSON(
        `https://anabot.my.id/api/ai/perplexity?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);

      const result = r.data?.data?.result;

      return sendResponse(
        res,
        "ai",
        "perplexity",
        "Perplexity",
        {
          answer: result?.gpt || null,
          sources: result?.source || []
        },
        r.ping
      );
    }

    // ===================================================
    // ⚡ TURBOSEEK
    // ===================================================
    if (category === "ai" && name === "turboseek") {
      const { prompt } = req.query;

      const r = await fetchJSON(
        `https://anabot.my.id/api/ai/turboseek?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);

      const result = r.data?.data?.result;

      return sendResponse(
        res,
        "ai",
        "turboseek",
        "TurboSeek",
        result,
        r.ping
      );
    }

    // ===================================================
    // 🧠 DEEPAI
    // ===================================================
    if (category === "ai" && name === "deepai") {
      const { prompt, type } = req.query;

      const r = await fetchJSON(
        `https://anabot.my.id/api/ai/deepai?prompt=${encodeURIComponent(prompt)}&type=${encodeURIComponent(type)}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);

      return sendResponse(
        res,
        "ai",
        "deepai",
        "DeepAI",
        r.data?.data?.result,
        r.ping
      );
    }

    // ===================================================
    // 🎬 DRAMA
    // ===================================================
    if (category === "drama" && name === "search") {
      const { q } = req.query;
      const r = await fetchJSON(
        `https://anabot.my.id/api/search/drama/melolo/search?query=${encodeURIComponent(q)}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);
      return sendResponse(res, "drama", "search", null, r.data, r.ping);
    }

    if (category === "drama" && name === "episode") {
      const { id } = req.query;
      const r = await fetchJSON(
        `https://anabot.my.id/api/search/drama/melolo/episode?series_id=${id}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);
      return sendResponse(res, "drama", "episode", null, r.data, r.ping);
    }

    // ===================================================
    // 🛠 TOOLS
    // ===================================================
    if (category === "tools" && name === "ssweb") {
      const { url, device = "windows", fullPage = "off" } = req.query;

      const r = await fetchJSON(
        `https://anabot.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&device=${device}&fullPage=${fullPage}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);

      return sendResponse(
        res,
        "tools",
        "ssweb",
        null,
        { image: r.data.data.result },
        r.ping
      );
    }

    if (category === "tools" && name === "unban") {
      const { number } = req.query;

      const r = await fetchJSON(
        `https://api.yydz.biz.id/api/tools/unban?number=${encodeURIComponent(number)}&apikey=P5btAuX`
      );
      if (!r.success) return res.status(504).json(r);

      delete r.data?.data?.messageId;

      return sendResponse(res, "tools", "unban", null, r.data.data, r.ping);
    }

    // ===================================================
// ===================================================
// 📊 TOOLS — STOK XL (SCRAPING)
// ===================================================
if (category === "tools" && name === "stokxl") {

  const r = await fetchHTML("https://juraganxl.my.id/");
  if (!r.success) return res.status(504).json(r);

  const clean = r.data
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ");

  const idx = [...clean.matchAll(/XDA\d+/gi)].map(m => m.index);
  const data = [];

  for (let i = 0; i < idx.length; i++) {

    const block = clean.slice(idx[i], idx[i + 1] || clean.length);

    const name = block.match(/XDA\d+/i)?.[0];
    if (!name) continue;

    const stock =
      block.match(/stock\s*:\s*(\d+)/i)?.[1] ||
      block.match(/stok\s*:\s*(\d+)/i)?.[1] ||
      "0";

    const quotas = [...block.matchAll(/Area\s*(\d+)\s*(\d+)GB/gi)]
      .map(q => `Area ${q[1]} : ${q[2]}GB`);

    data.push({ name, stock, quotas });
  }

  return sendResponse(res, "tools", "stokxl", null, data, r.ping);
}

    // ===================================================
// 📶 CEK KUOTA XL — PRO MAX 😎
// ===================================================
if (category === "tools" && name === "cekxl") {

  const number =
  req.query.number ||
  req.query.nomor ||
  req.query.no ||
  req.query.msisdn;
  if (!number) {
    return res.status(400).json({
      success: false,
      error: "Parameter number diperlukan"
    });
  }

  // 🔥 Web checker sumber
  const targetURL =
  "https://murakata.wuaze.com/cek-kuota.php";

const start = Date.now();

const res2 = await fetch(targetURL, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  },
  body: `nomor=${encodeURIComponent(number)}`
});

const html = await res2.text();

const r = {
  success: true,
  data: html,
  ping: Date.now() - start
};
  // ======================
  // CLEAN HTML → TEXT
  // ======================
  const clean = r.data
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "\n")
    .replace(/\n+/g, "\n")
    .trim();

  const pick = (label) => {
    const m = clean.match(new RegExp(label + "\\s*:?\\s*(.+)", "i"));
    return m ? m[1].trim() : null;
  };

  // ======================
  // BASIC INFO
  // ======================
  const data = {
    number,
    operator: pick("Tipe Kartu"),
    network: pick("Jaringan"),
    verified: pick("Verif ID"),
    card_age: pick("Umur Kartu"),
    active_until: pick("Masa Aktif"),
    grace_period: pick("Masa Tenggang"),
    packages: []
  };

  // ======================
  // PARSE PAKET + KUOTA
  // ======================
  const lines = clean.split("\n");

  let current = null;

  for (const line of lines) {

    // 📦 Paket baru (ada tanggal | nama paket)
    if (/\d{2}-\d{2}-\d{4}\s*\|/.test(line)) {

      if (current) data.packages.push(current);

      const [date, name] = line.split("|").map(s => s.trim());

      current = {
        name,
        valid_until: date,
        quotas: []
      };

      continue;
    }

    // 📊 Kuota (format: used / total)
    if (/\/\s*\d+/.test(line) && current) {

      const parts = line.split(/\s+/);

      const total = parts.pop();
      const used = parts.pop();

      const name = parts.join(" ");

      current.quotas.push({
        name,
        used,
        total
      });
    }
  }

  if (current) data.packages.push(current);

  // ======================
  // RETURN API RESPONSE
  // ======================
  return sendResponse(
    res,
    "tools",
    "cekxl",
    "XL Checker PRO MAX 😎",
    data,
    r.ping
  );
}
//===============
    // 📥 DOWNLOAD
    // ===================================================
    if (category === "download" && name === "gdrive") {
      const { url } = req.query;

      const r = await fetchJSON(
        `https://anabot.my.id/api/download/gDrive?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);

      return sendResponse(
        res,
        "download",
        "gdrive",
        "Google Drive",
        r.data?.data?.result,
        r.ping
      );
    }

    if (category === "download" && name === "facebook") {
      const { url } = req.query;

      const r = await fetchJSON(
        `https://anabot.my.id/api/download/facebook?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);

      return sendResponse(
        res,
        "download",
        "facebook",
        "Facebook",
        r.data?.data?.result,
        r.ping
      );
    }

    if (category === "download" && name === "instagram") {
      const { url } = req.query;

      const r = await fetchJSON(
        `https://anabot.my.id/api/download/instagram?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);

      return sendResponse(
        res,
        "download",
        "instagram",
        "Instagram",
        r.data?.data?.result,
        r.ping
      );
    }

    if (category === "download" && name === "tiktok") {
      const { url } = req.query;

      const r = await fetchJSON(
        `https://anabot.my.id/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);

      return sendResponse(
        res,
        "download",
        "tiktok",
        "TikTok",
        r.data?.data?.result,
        r.ping
      );
    }

    if (category === "download" && name === "capcut") {
      const { url } = req.query;

      const r = await fetchJSON(
        `https://anabot.my.id/api/download/capcut?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );
      if (!r.success) return res.status(504).json(r);

      return sendResponse(
        res,
        "download",
        "capcut",
        "CapCut",
        r.data?.data?.result,
        r.ping
      );
    }

    if (category === "download" && name === "sitezip") {
      const { url } = req.query;

      const r = await fetchJSON(
        `https://copier.saveweb2zip.com/api/downloadArchive/${url}`
      );
      if (!r.success) return res.status(504).json(r);

      return sendResponse(
        res,
        "download",
        "sitezip",
        "SaveWeb2Zip",
        r.data,
        r.ping
      );
    }

    // ===================================================
    // ❌ DEFAULT
    // ===================================================
    return res.status(404).json({
      success: false,
      error: "Endpoint not found",
      category,
      endpoint: name
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
