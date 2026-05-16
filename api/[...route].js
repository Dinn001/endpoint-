import { API_USERS } from "../lib/database.js";
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
    base_url: "https://rest.api.dinns.my.id",
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
// 🌐 FETCH POST (SCRAPE FORM)
// ======================
async function fetchPOST(url, body, timeout = 14000) {
  const start = Date.now();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36"
      },
      body: new URLSearchParams(body)
    });

    const html = await res.text();

    return { success: true, data: html, ping: Date.now() - start };

  } catch (err) {
    return {
      success: false,
      error: err.name === "AbortError"
        ? "Request timeout"
        : err.message,
      ping: Date.now() - start
    };
  } finally {
    clearTimeout(id);
  }
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

    const user = API_USERS[apikey];

    if (!user) {
      return res.status(403).json({
        success: false,
        error: "Invalid API key"
      });
    }

    if (user.limit !== Infinity && user.used >= user.limit) {
      return res.status(429).json({
        success: false,
        error: "Limit penggunaan habis"
      });
    }

    user.used++;

    // ======================
// 📍 ROUTING UNIVERSAL FIX
// ======================

// Ambil dari query dulu
let route = req.query.route;

// Jika tidak ada, parse dari URL manual
if (!route) {
  const pathname = req.url.split("?")[0];
  route = pathname.replace(/^\/api\//, "").split("/").filter(Boolean);
}

// Jika string → ubah jadi array
if (typeof route === "string") route = [route];

const category = route[0] || "unknown";
const name = route[1] || "unknown";

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
// 👑 ADMIN PANEL DATA
// ===================================================
if (category === "admin") {

  // hanya OWNER boleh akses
  if (user.role !== "owner") {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const users = Object.entries(API_USERS).map(([key, u]) => ({
    apikey: key,
    name: u.name,
    role: u.role,
    limit: u.limit === Infinity ? "Unlimited" : u.limit,
    used: u.used,
    remaining: u.limit === Infinity ? "Unlimited" : (u.limit - u.used)
  }));

  return res.json({
    success: true,
    total: users.length,
    users
  });
}
// ===================================================
// 🔊 AI — TEXT TO SPEECH (OMEGATECH)
// ===================================================
if (category === "ai" && name === "text-to-speech") {

  const { text, voice } = req.query;

  if (!text) {
    return res.status(400).json({
      success: false,
      error: "Parameter text diperlukan"
    });
  }

  const start = Date.now();

  try {

    const r = await fetchJSON(
      `https://omegatech-api.dixonomega.tech/api/ai/text-to-speech?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice || "Bella")}`
    );

    if (!r.status) {
      return res.status(502).json({
        success: false,
        error: "Gagal generate suara"
      });
    }

    const audio = r.result?.audio;

    return sendResponse(
      res,
      "ai",
      "tts",
      "Text To Speech",
      {
        text,
        voice: r.result?.voice,
        length: r.result?.text_length,
        audio
      },
      Date.now() - start
    );

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
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
// 📌 SEARCH — PINTEREST
// ===================================================
if (category === "search" && name === "pinterest") {

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: "Parameter q diperlukan"
    });
  }

  const apiUrl =
    `https://apikey-fyxzpedia.vercel.app/search/pinterest?apikey=Fyxz&q=${encodeURIComponent(q)}`;

  const r = await fetchJSON(apiUrl);

  if (!r.success) return res.status(504).json(r);

  const result = r.data?.result || [];

  if (!Array.isArray(result) || result.length === 0) {
    return res.status(404).json({
      success: false,
      error: "Gambar tidak ditemukan"
    });
  }

  // 🔥 Ambil 5 gambar pertama
  const images = result.slice(0, 5);

  return sendResponse(
    res,
    "search",
    "pinterest",
    "Pinterest Search",
    {
      query: q,
      total: result.length,
      images
    },
    r.ping
  );
}
    // ===================================================
// 🧪 TEST ENDPOINT (OWNER ONLY)
// ===================================================
if (category === "search" && name === "xnxx") {

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: "Parameter q diperlukan"
    });
  }

  const r = await fetchJSON(
    `https://api.yydz.biz.id/api/nswf/xnxx/search?q=${encodeURIComponent(q)}&apikey=P5btAuX`
  );

  if (!r.success) return res.status(504).json(r);

  const result = r.data?.data || [];

  const data = result.map(v => ({
    id: v.videoId,
    url: v.videoUrl,
    thumbnail: v.thumbnail,
    author: v.uploaderName,
    views: v.views,
    duration: v.duration,
    quality: v.resolution
  }));

  return sendResponse(
    res,
    "search",
    "xnxx",
    "Gacor",
    {
      query: q,
      total: data.length,
      results: data
    },
    r.ping
  );
}
    // ===================================================
// 🔎 SEARCH — GOOGLE IMAGE
// ===================================================
if (category === "search" && name === "gimage") {

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: "Parameter q diperlukan"
    });
  }

  const apiUrl =
    `https://apikey-fyxzpedia.vercel.app/search/gimage?apikey=Fyxz&q=${encodeURIComponent(q)}`;

  const r = await fetchJSON(apiUrl);

  if (!r.success) return res.status(504).json(r);

  const images = r.data?.result?.images || [];

  if (!Array.isArray(images) || images.length === 0) {
    return res.status(404).json({
      success: false,
      error: "Gambar tidak ditemukan"
    });
  }

  // 🔥 Ambil 5 gambar valid pertama
  const results = images
    .filter(img => img?.imageUrl && img.imageUrl.length > 5)
    .slice(0, 5)
    .map(img => img.imageUrl);

  return sendResponse(
    res,
    "search",
    "gimage",
    "Google Image Search",
    {
      query: q,
      total: images.length,
      images: results
    },
    r.ping
  );
}
// ===================================================
// 🔎 YOUTUBE SEARCH
// ===================================================
if (category === "search" && name === "youtube") {

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: "Parameter q diperlukan"
    });
  }

  const apiUrl =
    `https://apikey-fyxzpedia.vercel.app/search/youtube?apikey=Fyxz&q=${encodeURIComponent(q)}`;

  const r = await fetchJSON(apiUrl);

  if (!r.success) return res.status(504).json(r);

  const result = r.data?.result?.[0];

  if (!result) {
    return res.status(404).json({
      success: false,
      error: "Video tidak ditemukan"
    });
  }

  const data = {
    title: result.title,
    url: result.url,
    duration: result.duration,
    views: result.views,
    channel: result.author?.name || null,
    thumbnail: result.thumbnail
  };

  return sendResponse(
    res,
    "search",
    "youtube",
    "YouTube Search",
    data,
    r.ping
  );
}
    // ===================================================
// 🎵 SEARCH — TIKTOK (TTSEARCH)
// ===================================================
if (category === "search" && name === "ttsearch") {

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: "Parameter q diperlukan"
    });
  }

  const apiUrl =
    `https://apikey-fyxzpedia.vercel.app/search/tiktok?apikey=Fyxz&q=${encodeURIComponent(q)}`;

  const r = await fetchJSON(apiUrl);

  if (!r.success) return res.status(504).json(r);

  const results = r.data?.result || [];

  if (!Array.isArray(results) || results.length === 0) {
    return res.status(404).json({
      success: false,
      error: "Video tidak ditemukan"
    });
  }

  // 🔥 Ambil 5 hasil pertama
  const videos = results.slice(0, 5).map(v => ({
    title: v.title || "-",
    author: v.author?.nickname || "-",
    duration: v.duration || 0,
    views: v.play_count || 0,
    url: v.play || null
  }));

  // ✅ RESPON DEFAULT DINNS API
  return sendResponse(
    res,
    "search",
    "ttsearch",
    "TikTok Search",
    {
      query: q,
      total: results.length,
      results: videos
    },
    r.ping
  );
}
    // ===================================================
// 📖 SEARCH — SURAH QURAN
// ===================================================
if (category === "search" && name === "surah") {

  const { surah } = req.query;

  if (!surah) {
    return res.status(400).json({
      success: false,
      error: "Parameter surah diperlukan"
    });
  }

  const r = await fetchJSON(
    `https://anabot.my.id/api/search/surah?surah=${encodeURIComponent(surah)}&apikey=freeApikey`
  );

  if (!r.success) return res.status(504).json(r);

  const result = r.data?.data?.result;

  if (!result || result.length === 0) {
    return res.status(404).json({
      success: false,
      error: "Surah tidak ditemukan"
    });
  }

  return sendResponse(
    res,
    "search",
    "surah",
    "Quran Surah",
    {
      surah,
      total_ayat: result.length,
      ayat: result
    },
    r.ping
  );
}

// ===================================================
// 🕌 SEARCH — JADWAL SHOLAT
// ===================================================
if (category === "search" && name === "jadwalsholat") {

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: "Parameter q (kota) diperlukan"
    });
  }

  const r = await fetchJSON(
    `https://anabot.my.id/api/search/jadwalsholat?query=${encodeURIComponent(q)}&apikey=freeApikey`
  );

  if (!r.success) return res.status(504).json(r);

  const result = r.data?.data?.result;

  if (!result) {
    return res.status(404).json({
      success: false,
      error: "Jadwal tidak ditemukan"
    });
  }

  return sendResponse(
    res,
    "search",
    "jadwalsholat",
    "Jadwal Sholat",
    result,
    r.ping
  );
}
    // ===================================================
// 📡 TOOLS — TRI CHECK
// ===================================================
if (category === "tools" && name === "tricek") {

  let { number } = req.query;

  if (!number) {
    return res.status(400).json({
      success: false,
      error: "Parameter number diperlukan"
    });
  }

  let msisdn = number.replace(/[^0-9]/g, '');

  if (msisdn.startsWith('08')) {
    msisdn = '62' + msisdn.slice(1);
  }

  const triPrefix = /^(6289[5-9])/;

  if (!triPrefix.test(msisdn)) {
    return res.status(400).json({
      success: false,
      error: "Nomor bukan SIM TRI (0895–0899)"
    });
  }

  const start = Date.now();

  try {

    const response = await fetch("https://tri.co.id/api/v1/information/sim-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Origin": "https://tri.co.id",
        "Referer": "https://tri.co.id/"
      },
      body: JSON.stringify({
        action: "MSISDN_STATUS_WEB",
        input1: "",
        input2: "",
        language: "ID",
        msisdn
      })
    });

    const result = await response.json();

    if (!result?.status || result?.data?.responseCode !== "00000") {
      return res.status(404).json({
        success: false,
        error: "Nomor tidak valid atau bukan SIM TRI"
      });
    }

    const data = result.data;

    const now = new Date();
    const endDate = data.actEndDate ? new Date(data.actEndDate) : null;

    const remainingDays = endDate && !isNaN(endDate)
      ? Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))
      : null;

    return sendResponse(
      res,
      "tools",
      "tricheck",
      "Tri SIM Check",
      {
        number: data.msisdn,
        iccid: data.iccid,
        card_status: data.cardStatus,
        registration_status: data.activationStatus,
        activation_date: data.activationDate,
        expired_date: data.actEndDate,
        remaining_days: remainingDays,
        product: data.prodDesc,
        region: data.retDistrict
      },
      Date.now() - start
    );

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
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
// 🖼 TOOLS — REMINI (IMAGE ENHANCE)
// ===================================================
if (category === "tools" && name === "remini") {

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: "Parameter url diperlukan"
    });
  }

  const start = Date.now();

  try {

    const r = await fetchJSON(
      `https://omegatech-api.dixonomega.tech/api/tools/remini?url=${encodeURIComponent(url)}`
    );

    if (!r.status) {
      return res.status(502).json({
        success: false,
        error: "Gagal enhance gambar"
      });
    }

    const result = r.result;

    return sendResponse(
      res,
      "tools",
      "remini",
      "Remini Image Enhance",
      {
        original: url,
        enhanced: result
      },
      Date.now() - start
    );

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
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
    .replace(/<[^>]*>/g, " ")  .replace(/\s+/g, " ");

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
// ===================================================
// 📶 CEK KUOTA XL — KMSp SAFE MODE
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

  let num = number.replace(/\D/g, "");
  if (num.startsWith("08")) num = "62" + num.slice(1);
  if (num.startsWith("8")) num = "62" + num;

  const start = Date.now();

  try {

    const response = await fetch(
      "https://apigw.kmsp-store.com/sidompul/v4/cek_kuota?" +
      new URLSearchParams({
        msisdn: num,
        isJSON: "true"
      }),
      {
        method: "GET",
        headers: {
          "Authorization": "Basic c2lkb21wdWxhcGk6YXBpZ3drbXNw", // isi benar
          "X-API-Key": "60ef29aa-a648-4668-90ae-20951ef90c55",            // isi benar
          "X-App-Version": "4.0.0",
          "User-Agent": "okhttp/4.9.0"
        }
      }
    );

    // 🔥 AMAN — baca text dulu
    const text = await response.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        error: "Response bukan JSON",
        raw: text.slice(0, 300)
      });
    }

    if (!json.status) {
      return res.status(400).json({
        success: false,
        error:
          json?.data?.keteranganError ||
          json?.message ||
          "Gagal mengambil data"
      });
    }

    const raw = json.data?.hasil || "Tidak ada informasi.";

    const clean = raw
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<b>/gi, "")
      .replace(/<\/b>/gi, "")
      .replace(/<[^>]*>?/gm, "")
      .trim();

    return sendResponse(
      res,
      "tools",
      "cekxl",
      "XL Checker KMSp",
      {
        number: num,
        result: clean
      },
      Date.now() - start
    );

  } catch (err) {

    return res.status(500).json({
      success: false,
      error: "Server error",
      detail: err.message
    });

  }
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
    // ===================================================
// 📥 DOWNLOAD — SFILE
// ===================================================
if (category === "download" && name === "sfile") {

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: "Parameter url diperlukan"
    });
  }

  const r = await fetchJSON(
    `https://api.yydz.biz.id/api/download/sfile?url=${encodeURIComponent(url)}&apikey=P5btAuX`
  );

  if (!r.success) return res.status(504).json(r);

  const result = r.data?.data || {};

  const data = {
    title: result.title || null,
    size: result.size || null,
    mimetype: result.mimetype || null,
    creator: result.creator || null,
    category: result.category || null,
    upload_date: result.upload_date || null,
    download: result.downloadUrl || null
  };

  return sendResponse(
    res,
    "download",
    "sfile",
    "Sfile Downloader",
    data,
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
// 😈 STICKER — BRAT TEXT
// ===================================================
if (category === "sticker" && name === "brat") {

  const { text } = req.query;

  if (!text) {
    return res.status(400).json({
      success: false,
      error: "Parameter text diperlukan"
    });
  }

  const apiUrl =
    `https://apikey-fyxzpedia.vercel.app/imagecreator/bratv?apikey=Fyxz&text=${encodeURIComponent(text)}`;

  const start = Date.now();

  const response = await fetch(apiUrl);

  if (!response.ok) {
    return res.status(502).json({
      success: false,
      error: "Gagal membuat sticker brat"
    });
  }

  const arrayBuffer = await response.arrayBuffer();

const base64 = `data:image/png;base64,${btoa(
  String.fromCharCode(...new Uint8Array(arrayBuffer))
)}`;

  const data = {
    text,
    image_base64: base64
  };

  return sendResponse(
    res,
    "sticker",
    "brat",
    "Brat Sticker Generator",
    data,
    Date.now() - start
  );
}

// ===================================================
// 📌 TRIAL VPN API
// ===================================================

if (category === "vpn" && name === "trial") {

  const { protocol, auth, timer } = req.query;

  // ✅ Validasi auth
  if (!auth) {
    return res.status(400).json({
      success: false,
      error: "Parameter auth diperlukan"
    });
  }

  // ✅ Validasi protocol
  const allowedProtocols = [
    "vmess",
    "vless",
    "trojan",
    "ssh"
  ];

  if (!protocol) {
    return res.status(400).json({
      success: false,
      error: "Parameter protocol diperlukan"
    });
  }

  if (!allowedProtocols.includes(protocol.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: "Protocol tidak valid",
      allowed: allowedProtocols
    });
  }

  // ⏳ Default timer
  const time = timer || "1";

  // 🌐 API URL
  const url =
    `https://id.dinns.my.id/api/trial-${protocol.toLowerCase()}?auth=${encodeURIComponent(auth)}&timer=${encodeURIComponent(time)}`;

  try {

    const r = await fetchJSON(url);

    // ❌ Error API
    if (!r || r.status !== "success") {
      return res.status(504).json({
        success: false,
        error: `Gagal membuat akun ${protocol.toUpperCase()}`,
        result: r
      });
    }

    // ✅ Success
    return sendResponse(
      res,
      "vpn",
      "trial",
      `Trial ${protocol.toUpperCase()}`,
      r.data,
      r.ping || null
    );

  } catch (e) {

    return res.status(500).json({
      success: false,
      error: "Terjadi kesalahan server",
      message: e.message
    });
  }
  }
// ===================================================
// 😀 STICKER — EMOJIMIX
// ===================================================
if (category === "sticker" && name === "emojimix") {

  const emoji1 = req.query.emoji1 || req.query.e1;
  const emoji2 = req.query.emoji2 || req.query.e2;

  if (!emoji1 || !emoji2) {
    return res.status(400).json({
      success: false,
      error: "Parameter emoji1 dan emoji2 diperlukan"
    });
  }

  const apiUrl =
    `https://apikey-fyxzpedia.vercel.app/tools/emojimix?apikey=Fyxz&emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`;

  const start = Date.now();

  const response = await fetch(apiUrl);

  if (!response.ok) {
    return res.status(502).json({
      success: false,
      error: "Gagal mengambil gambar emojimix"
    });
  }

  const arrayBuffer = await response.arrayBuffer();

  const base64 = `data:image/png;base64,${btoa(
    String.fromCharCode(...new Uint8Array(arrayBuffer))
  )}`;

  const data = {
    emoji1,
    emoji2,
    image_base64: base64
  };

  return sendResponse(
    res,
    "sticker",
    "emojimix",
    "Emoji Mix Generator",
    data,
    Date.now() - start
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
    console.error("API ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Internal Server Error"
    });
  }
}
