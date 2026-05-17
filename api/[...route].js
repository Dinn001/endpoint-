import { getUser, supabase } from "../lib/database.js";

// ======================
// 🆔 RANDOM ID GENERATOR
// ======================
function generateId(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ======================
// 📦 RESPONSE FORMAT STANDARD
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
async function fetchPOST(url, body, timeout = 9000) {
  const start = Date.now();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36"
      },
      body: new URLSearchParams(body)
    });

    const html = await res.text();
    return { success: true, data: html, ping: Date.now() - start };
  } catch (err) {
    return {
      success: false,
      error: err.name === "AbortError" ? "Request timeout" : err.message,
      ping: Date.now() - start
    };
  } finally {
    clearTimeout(id);
  }
}

// ======================
// 🌐 FETCH HTML (SCRAPE)
// ======================
async function fetchHTML(url, timeout = 9000) {
  const start = Date.now();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36"
      }
    });

    const html = await res.text();
    return { success: true, data: html, ping: Date.now() - start };
  } catch (err) {
    return {
      success: false,
      error: err.name === "AbortError" ? `Request timeout (> ${timeout / 1000}s)` : err.message,
      ping: Date.now() - start
    };
  } finally {
    clearTimeout(id);
  }
}

// ======================
// ⏱ FETCH JSON (Super Defensif — Kebal Error Teks/HTML Target)
// ======================
async function fetchJSON(url, timeout = 9000, options = {}) {
  const start = Date.now();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
      "Accept": "application/json",
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers
    });

    const text = await res.text();
    const cleanText = text.trim();

    // 🛡️ Uji coba parsing aman menggunakan try-catch lokal
    try {
      const data = JSON.parse(cleanText);
      
      if (!res.ok) {
        return {
          success: false,
          error: `Target Server Error (HTTP ${res.status})`,
          raw_snippet: cleanText.slice(0, 150),
          ping: Date.now() - start
        };
      }

      return { success: true, data, ping: Date.now() - start };
    } catch (parseError) {
      // Menangkap respon HTML/Teks biasa jika API target down atau terblokir Cloudflare
      return {
        success: false,
        error: "Target API mengirimkan respon Teks/HTML biasa, bukan JSON valid.",
        raw_snippet: cleanText.slice(0, 200),
        ping: Date.now() - start
      };
    }

  } catch (err) {
    return {
      success: false,
      error: err.name === "AbortError" ? `Request timeout (> ${timeout / 1000}s)` : err.message,
      ping: Date.now() - start
    };
  } finally {
    clearTimeout(id);
  }
}

// ======================
// 🚀 MAIN FUNCTION HANDLER
// ======================
export default async function handler(req, res) {
  try {
    const { apikey } = req.query;
    
    // 🔍 1. Validasi Akun dari Supabase
    const user = await getUser(apikey);

    if (!user) {
      return res.status(403).json({ success: false, error: "Invalid API key" });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, error: "API key kamu telah dinonaktifkan oleh Admin." });
    }

    // 📊 2. Validasi Limit (999999 = Pengganti nilai Infinity untuk Owner)
    if (user.limit !== 999999 && user.used >= user.limit) {
      return res.status(429).json({ success: false, error: "Limit penggunaan habis" });
    }

    // 🆙 3. Naikkan hitungan 'used' +1 ke database cloud
    await supabase
      .from('api_users')
      .update({ used: user.used + 1 })
      .eq('apikey', user.apikey);

    // Universal Routing Engine
    let route = req.query.route;
    if (!route) {
      const pathname = req.url.split("?")[0];
      route = pathname.replace(/^\/api\//, "").split("/").filter(Boolean);
    }

    if (typeof route === "string") route = [route];

    const category = route[0] || "unknown";
    const name = route[1] || "unknown";

    // ===================================================
    // 👑 MENU ADMIN: PANELS & APICONTROL (SUPABASE)
    // ===================================================
    if (category === "admin") {
      if (user.role !== "owner") {
        return res.status(401).json({ success: false, error: "Unauthorized. Menu khusus owner." });
      }

      // SUB-MENU: ADD / UPDATE USER
      if (name === "add") {
        const { target_key, name: target_name, limit: target_limit, role: target_role } = req.query;

        if (!target_key || !target_name) {
          return res.status(400).json({ success: false, error: "Parameter 'target_key' dan 'name' wajib diisi." });
        }

        const parsedLimit = target_role === "owner" ? 999999 : (parseInt(target_limit) || 100);

        const { error } = await supabase
          .from('api_users')
          .upsert({
            apikey: target_key.trim(),
            name: target_name.trim(),
            role: target_role || 'user',
            limit: parsedLimit,
            used: 0,
            active: true
          }, { onConflict: 'apikey' });

        if (error) return res.status(500).json({ success: false, error: "Supabase Write Error", detail: error.message });

        return res.json({ 
          success: true, 
          message: `API Key '${target_key}' berhasil dikonfigurasi!`,
          data: { apikey: target_key, name: target_name, limit: parsedLimit >= 999999 ? "Unlimited" : parsedLimit, role: target_role || 'user' }
        });
      }

      // SUB-MENU: HAPUS USER
      if (name === "delete") {
        const { target_key } = req.query;
        if (!target_key) return res.status(400).json({ success: false, error: "Parameter 'target_key' wajib dicantumkan." });

        if (target_key === apikey) {
          return res.status(400).json({ success: false, error: "Sistem memblokir permintaan hapus key owner diri sendiri!" });
        }

        const { error } = await supabase
          .from('api_users')
          .delete()
          .eq('apikey', target_key.trim());

        if (error) return res.status(500).json({ success: false, error: "Supabase Delete Error", detail: error.message });

        return res.json({ success: true, message: `API Key '${target_key}' telah dihapus dari cloud database.` });
      }

      // DEFAULT LIST ALL USERS
      const { data: allUsers, error } = await supabase.from('api_users').select('*');
      if (error) return res.status(500).json({ success: false, error: "Supabase Read Error" });

      const list = allUsers.map(u => ({
        apikey: u.apikey,
        name: u.name,
        role: u.role,
        limit: u.limit >= 999999 ? "Unlimited" : u.limit,
        used: u.used,
        remaining: u.limit >= 999999 ? "Unlimited" : Math.max(0, u.limit - u.used),
        status: u.active ? "Aktif" : "Banned"
      }));

      return res.json({ success: true, total_users: list.length, users: list });
    }

    // ===================================================
    // 🤖 AI CHAT (LOCAL)
    // ===================================================
    if (category === "ai" && name === "chat") {
      const { q } = req.query;
      return sendResponse(res, "ai", "chat", "Dinns AI", { reply: `Halo! Kamu bilang: ${q || ""}` }, 0);
    }

    // ===================================================
    // 🔊 AI — TEXT TO SPEECH
    // ===================================================
    if (category === "ai" && name === "text-to-speech") {
      const { text, voice } = req.query;
      if (!text) return res.status(400).json({ success: false, error: "Parameter text diperlukan" });

      const start = Date.now();
      const r = await fetchJSON(`https://omegatech-api.dixonomega.tech/api/ai/text-to-speech?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice || "Bella")}`);
      if (!r.success || !r.data?.status) {
        return res.status(502).json({ success: false, error: "Gagal generate suara", raw: r.raw_snippet || null });
      }
      return sendResponse(res, "ai", "tts", "Text To Speech", {
        text,
        voice: r.data.result?.voice,
        length: r.data.result?.text_length,
        audio: r.data.result?.audio
      }, Date.now() - start);
    }

    // ===================================================
    // 🤖 AI SUITE — CICI, PERPLEXITY, TURBOSEEK, DEEPAI
    // ===================================================
    if (category === "ai" && name === "cici") {
      const { prompt } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/ai/cici?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "ai", "cici", "Dinns AI", r.data?.data?.result, r.ping);
    }

    if (category === "ai" && name === "perplexity") {
      const { prompt } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/ai/perplexity?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      const result = r.data?.data?.result;
      return sendResponse(res, "ai", "perplexity", "Perplexity", { answer: result?.gpt || null, sources: result?.source || [] }, r.ping);
    }

    if (category === "ai" && name === "turboseek") {
      const { prompt } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/ai/turboseek?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "ai", "turboseek", "TurboSeek", r.data?.data?.result, r.ping);
    }

    if (category === "ai" && name === "deepai") {
      const { prompt, type } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/ai/deepai?prompt=${encodeURIComponent(prompt)}&type=${encodeURIComponent(type)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "ai", "deepai", "DeepAI", r.data?.data?.result, r.ping);
    }

    // ===================================================
    // 🎬 DRAMA SEARCH & EPISODE
    // ===================================================
    if (category === "drama" && name === "search") {
      const { q } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/search/drama/melolo/search?query=${encodeURIComponent(q)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "drama", "search", null, r.data, r.ping);
    }

    if (category === "drama" && name === "episode") {
      const { id } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/search/drama/melolo/episode?series_id=${id}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "drama", "episode", null, r.data, r.ping);
    }

    // ===================================================
    // 🔎 ENGINE SEARCH — PINTEREST, XNXX, GIMAGE, YOUTUBE, TIKTOK
    // ===================================================
    if (category === "search" && name === "pinterest") {
      const { q } = req.query;
      if (!q) return res.status(400).json({ success: false, error: "Parameter q diperlukan" });
      const r = await fetchJSON(`https://apikey-fyxzpedia.vercel.app/search/pinterest?apikey=Fyxz&q=${encodeURIComponent(q)}`);
      if (!r.success) return res.status(502).json(r);
      const result = r.data?.result || [];
      return sendResponse(res, "search", "pinterest", "Pinterest Search", { query: q, total: result.length, images: result.slice(0, 5) }, r.ping);
    }

    if (category === "search" && name === "xnxx") {
      const { q } = req.query;
      if (!q) return res.status(400).json({ success: false, error: "Parameter q diperlukan" });
      const r = await fetchJSON(`https://api.yydz.biz.id/api/nswf/xnxx/search?q=${encodeURIComponent(q)}&apikey=P5btAuX`);
      if (!r.success) return res.status(502).json(r);
      const data = (r.data?.data || []).map(v => ({ id: v.videoId, url: v.videoUrl, thumbnail: v.thumbnail, views: v.views, duration: v.duration, quality: v.resolution }));
      return sendResponse(res, "search", "xnxx", "Gacor", { query: q, total: data.length, results: data }, r.ping);
    }

    if (category === "search" && name === "gimage") {
      const { q } = req.query;
      if (!q) return res.status(400).json({ success: false, error: "Parameter q diperlukan" });
      const r = await fetchJSON(`https://apikey-fyxzpedia.vercel.app/search/gimage?apikey=Fyxz&q=${encodeURIComponent(q)}`);
      if (!r.success) return res.status(502).json(r);
      const images = (r.data?.result?.images || []).filter(img => img?.imageUrl).slice(0, 5).map(img => img.imageUrl);
      return sendResponse(res, "search", "gimage", "Google Image Search", { query: q, images }, r.ping);
    }

    if (category === "search" && name === "youtube") {
      const { q } = req.query;
      if (!q) return res.status(400).json({ success: false, error: "Parameter q diperlukan" });
      const r = await fetchJSON(`https://apikey-fyxzpedia.vercel.app/search/youtube?apikey=Fyxz&q=${encodeURIComponent(q)}`);
      if (!r.success) return res.status(502).json(r);
      const result = r.data?.result?.[0];
      if (!result) return res.status(404).json({ success: false, error: "Video tidak ditemukan" });
      return sendResponse(res, "search", "youtube", "YouTube Search", result, r.ping);
    }

    if (category === "search" && name === "ttsearch") {
      const { q } = req.query;
      if (!q) return res.status(400).json({ success: false, error: "Parameter q diperlukan" });
      const r = await fetchJSON(`https://apikey-fyxzpedia.vercel.app/search/tiktok?apikey=Fyxz&q=${encodeURIComponent(q)}`);
      if (!r.success) return res.status(502).json(r);
      const videos = (r.data?.result || []).slice(0, 5).map(v => ({ title: v.title || "-", author: v.author?.nickname || "-", url: v.play || null }));
      return sendResponse(res, "search", "ttsearch", "TikTok Search", { query: q, results: videos }, r.ping);
    }

    // ===================================================
    // 📖 SEARCH RELIGION & UTILITIES
    // ===================================================
    if (category === "search" && name === "surah") {
      const { surah } = req.query;
      if (!surah) return res.status(400).json({ success: false, error: "Parameter surah diperlukan" });
      const r = await fetchJSON(`https://anabot.my.id/api/search/surah?surah=${encodeURIComponent(surah)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "search", "surah", "Quran Surah", { surah, ayat: r.data?.data?.result }, r.ping);
    }

    if (category === "search" && name === "jadwalsholat") {
      const { q } = req.query;
      if (!q) return res.status(400).json({ success: false, error: "Parameter q (kota) diperlukan" });
      const r = await fetchJSON(`https://anabot.my.id/api/search/jadwalsholat?query=${encodeURIComponent(q)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "search", "jadwalsholat", "Jadwal Sholat", r.data?.data?.result, r.ping);
    }

    // ===================================================
    // 📡 TOOLS — TRI CHECK
    // ===================================================
    if (category === "tools" && name === "tricek") {
      let { number } = req.query;
      if (!number) return res.status(400).json({ success: false, error: "Parameter number diperlukan" });

      let msisdn = number.replace(/[^0-9]/g, '');
      if (msisdn.startsWith('08')) msisdn = '62' + msisdn.slice(1);

      if (!/^(6289[5-9])/.test(msisdn)) return res.status(400).json({ success: false, error: "Nomor bukan SIM TRI (0895–0899)" });

      const start = Date.now();
      const r = await fetchJSON("https://tri.co.id/api/v1/information/sim-status", 9000, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Origin": "https://tri.co.id", "Referer": "https://tri.co.id/" },
        body: JSON.stringify({ action: "MSISDN_STATUS_WEB", input1: "", input2: "", language: "ID", msisdn })
      });

      if (!r.success) return res.status(502).json({ success: false, error: "Server Tri sedang gangguan", detail: r.raw_snippet });

      const result = r.data;
      if (!result?.status || result?.data?.responseCode !== "00000") return res.status(404).json({ success: false, error: "Nomor tidak terdaftar di sistem Tri" });

      const data = result.data;
      const remainingDays = data.actEndDate ? Math.max(0, Math.ceil((new Date(data.actEndDate) - new Date()) / (1000 * 60 * 60 * 24))) : null;

      return sendResponse(res, "tools", "tricheck", "Tri SIM Check", { number: data.msisdn, card_status: data.cardStatus, registration_status: data.activationStatus, expired_date: data.actEndDate, remaining_days: remainingDays, product: data.prodDesc }, Date.now() - start);
    }

    // ===================================================
    // 📸 SYSTEM TOOLS — SSWEB, UNBAN, REMINI, STOK XL, CEKXL
    // ===================================================
    if (category === "tools" && name === "ssweb") {
      const { url, device = "windows", fullPage = "off" } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&device=${device}&fullPage=${fullPage}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "tools", "ssweb", null, { image: r.data.data?.result }, r.ping);
    }

    if (category === "tools" && name === "unban") {
      const { number } = req.query;
      const r = await fetchJSON(`https://api.yydz.biz.id/api/tools/unban?number=${encodeURIComponent(number)}&apikey=P5btAuX`);
      if (!r.success) return res.status(502).json(r);
      delete r.data?.data?.messageId;
      return sendResponse(res, "tools", "unban", null, r.data.data, r.ping);
    }

    if (category === "tools" && name === "remini") {
      const { url } = req.query;
      if (!url) return res.status(400).json({ success: false, error: "Parameter url diperlukan" });
      const start = Date.now();
      const r = await fetchJSON(`https://omegatech-api.dixonomega.tech/api/tools/remini?url=${encodeURIComponent(url)}`);
      if (!r.success || !r.data?.status) return res.status(502).json({ success: false, error: "Gagal enhance gambar", detail: r.raw_snippet });
      return sendResponse(res, "tools", "remini", "Remini Image Enhance", { original: url, enhanced: r.data.result }, Date.now() - start);
    }

    if (category === "tools" && name === "stokxl") {
      const r = await fetchHTML("https://juraganxl.my.id/");
      if (!r.success) return res.status(502).json(r);
      const clean = r.data.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
      const idx = [...clean.matchAll(/XDA\d+/gi)].map(m => m.index);
      const data = [];
      for (let i = 0; i < idx.length; i++) {
        const block = clean.slice(idx[i], idx[i + 1] || clean.length);
        const nameXL = block.match(/XDA\d+/i)?.[0];
        if (!nameXL) continue;
        const stock = block.match(/stock\s*:\s*(\d+)/i)?.[1] || "0";
        const quotas = [...block.matchAll(/Area\s*(\d+)\s*(\d+)GB/gi)].map(q => `Area ${q[1]} : ${q[2]}GB`);
        data.push({ name: nameXL, stock, quotas });
      }
      return sendResponse(res, "tools", "stokxl", null, data, r.ping);
    }

    if (category === "tools" && name === "cekxl") {
      const number = req.query.number || req.query.nomor || req.query.msisdn;
      if (!number) return res.status(400).json({ success: false, error: "Parameter number diperlukan" });
      let num = number.replace(/\D/g, "");
      if (num.startsWith("08")) num = "62" + num.slice(1);

      const start = Date.now();
      const r = await fetchJSON("https://apigw.kmsp-store.com/sidompul/v4/cek_kuota?" + new URLSearchParams({ msisdn: num, isJSON: "true" }), 9000, {
        method: "GET",
        headers: { "Authorization": "Basic c2lkb21wdWxhcGk6YXBpZ3drbXNw", "X-API-Key": "60ef29aa-a648-4668-90ae-20951ef90c55", "X-App-Version": "4.0.0", "User-Agent": "okhttp/4.9.0" }
      });

      if (!r.success) return res.status(502).json({ success: false, error: "Gateway KMSp sedang down", detail: r.raw_snippet });
      if (!r.data.status) return res.status(400).json({ success: false, error: r.data?.data?.keteranganError || "Gagal menarik data" });

      const clean = (r.data.data?.hasil || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>?/gm, "").trim();
      return sendResponse(res, "tools", "cekxl", "XL Checker KMSp", { number: num, result: clean }, Date.now() - start);
    }

    // ===================================================
    // 📥 DOWNLOAD ENGINE — GDRIVE, FACEBOOK, SFILE, IG, TIKTOK, CAPCUT, SITEZIP
    // ===================================================
    if (category === "download" && name === "gdrive") {
      const { url } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/download/gDrive?url=${encodeURIComponent(url)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "download", "gdrive", "Google Drive", r.data?.data?.result, r.ping);
    }

    if (category === "download" && name === "facebook") {
      const { url } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/download/facebook?url=${encodeURIComponent(url)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "download", "facebook", "Facebook", r.data?.data?.result, r.ping);
    }

    if (category === "download" && name === "sfile") {
      const { url } = req.query;
      if (!url) return res.status(400).json({ success: false, error: "Parameter url diperlukan" });
      const r = await fetchJSON(`https://api.yydz.biz.id/api/download/sfile?url=${encodeURIComponent(url)}&apikey=P5btAuX`);
      if (!r.success) return res.status(502).json(r);
      const resData = r.data?.data || {};
      return sendResponse(res, "download", "sfile", "Sfile Downloader", { title: resData.title, size: resData.size, download: resData.downloadUrl }, r.ping);
    }

    if (category === "download" && name === "instagram") {
      const { url } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/download/instagram?url=${encodeURIComponent(url)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "download", "instagram", "Instagram", r.data?.data?.result, r.ping);
    }

    if (category === "download" && name === "tiktok") {
      const { url } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "download", "tiktok", "TikTok", r.data?.data?.result, r.ping);
    }

    if (category === "download" && name === "capcut") {
      const { url } = req.query;
      const r = await fetchJSON(`https://anabot.my.id/api/download/capcut?url=${encodeURIComponent(url)}&apikey=freeApikey`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "download", "capcut", "CapCut", r.data?.data?.result, r.ping);
    }

    if (category === "download" && name === "sitezip") {
      const { url } = req.query;
      const r = await fetchJSON(`https://copier.saveweb2zip.com/api/downloadArchive/${url}`);
      if (!r.success) return res.status(502).json(r);
      return sendResponse(res, "download", "sitezip", "SaveWeb2Zip", r.data, r.ping);
    }

    // ===================================================
    // 🎨 IMAGE CREATOR / STICKER — BRAT, EMOJIMIX
    // ===================================================
    if (category === "sticker" && name === "brat") {
      const { text } = req.query;
      if (!text) return res.status(400).json({ success: false, error: "Parameter text diperlukan" });
      const start = Date.now();
      const response = await fetch(`https://apikey-fyxzpedia.vercel.app/imagecreator/bratv?apikey=Fyxz&text=${encodeURIComponent(text)}`);
      if (!response.ok) return res.status(502).json({ success: false, error: "Gagal membuat sticker brat" });
      const base64 = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(await response.arrayBuffer())))}`;
      return sendResponse(res, "sticker", "brat", "Brat Sticker Generator", { text, image_base64: base64 }, Date.now() - start);
    }

    if (category === "sticker" && name === "emojimix") {
      const emoji1 = req.query.emoji1 || req.query.e1;
      const emoji2 = req.query.emoji2 || req.query.e2;
      if (!emoji1 || !emoji2) return res.status(400).json({ success: false, error: "Parameter emoji1 dan emoji2 diperlukan" });
      const start = Date.now();
      const response = await fetch(`https://apikey-fyxzpedia.vercel.app/tools/emojimix?apikey=Fyxz&emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`);
      if (!response.ok) return res.status(502).json({ success: false, error: "Gagal mengambil gambar emojimix" });
      const base64 = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(await response.arrayBuffer())))}`;
      return sendResponse(res, "sticker", "emojimix", "Emoji Mix Generator", { emoji1, emoji2, image_base64: base64 }, Date.now() - start);
    }

        // ===================================================
    // ❌ DEFAULT NOT FOUND ROUTE
    // ===================================================
    return res.status(404).json({ success: false, error: "Endpoint not found", category, endpoint: name });

  } catch (err) {
    // 🛠️ LOG DEBUGGING DI SINI
    console.error("==========================================");
    console.error("🚨 CRITICAL ERROR PADA RUTE:", req.query.route || `${category}/${name}`);
    console.error("❌ PESAN EROR:", err.stack || err.message);
    console.error("==========================================");
    
    return res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
} // <--- Ini adalah tanda kurung kurawal penutup fungsi handler utama
