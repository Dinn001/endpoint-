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
// ⏱ FETCH TIMEOUT + PING
// ======================
async function fetchWithTimeout(url, timeout = 14000) {
  const start = Date.now();

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();

    return {
      success: true,
      data,
      ping: Date.now() - start
    };

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

    // PATH SAFE
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

      const r = await fetchWithTimeout(
        `https://anabot.my.id/api/ai/cici?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`
      );

      if (!r.success) return res.status(504).json(r);

      return sendResponse(
        res,
        "ai",
        "cici",
        "Dinns AI",
        { result: r.data.data.result },
        r.ping
      );
    }

    // ===================================================
    // 🧠 PERPLEXITY
    // ===================================================
    if (category === "ai" && name === "perplexity") {

      const { prompt } = req.query;

      const r = await fetchWithTimeout(
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
          sources: (result?.source || []).map(s => ({
            title: s.name,
            url: s.url
          }))
        },
        r.ping
      );
    }

    // ===================================================
    // ⚡ TURBOSEEK
    // ===================================================
    if (category === "ai" && name === "turboseek") {

      const { prompt } = req.query;

      const r = await fetchWithTimeout(
        `https://anabot.my.id/api/ai/turboseek?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`
      );

      if (!r.success) return res.status(504).json(r);

      const result = r.data?.data?.result;

      return sendResponse(
        res,
        "ai",
        "turboseek",
        "TurboSeek",
        {
          answer: result?.message || null,
          sources: result?.sources || [],
          related_questions: result?.similarQuestions || []
        },
        r.ping
      );
    }

    // ===================================================
    // 🧠 DEEPAI
    // ===================================================
    if (category === "ai" && name === "deepai") {

      const { prompt, type } = req.query;

      const r = await fetchWithTimeout(
        `https://anabot.my.id/api/ai/deepai?prompt=${encodeURIComponent(prompt)}&type=${encodeURIComponent(type)}&apikey=freeApikey`
      );

      if (!r.success) return res.status(504).json(r);

      const result = r.data?.data?.result?.result;

      return sendResponse(
        res,
        "ai",
        "deepai",
        "DeepAI",
        {
          mode: type,
          answer: result || null
        },
        r.ping
      );
    }

    // ===================================================
    // 🎬 DRAMA SEARCH
    // ===================================================
    if (category === "drama" && name === "search") {

      const { q } = req.query;

      const r = await fetchWithTimeout(
        `https://anabot.my.id/api/search/drama/melolo/search?query=${encodeURIComponent(q)}&apikey=freeApikey`
      );

      if (!r.success) return res.status(504).json(r);

      return sendResponse(res, "drama", "search", null, r.data, r.ping);
    }

    // ===================================================
    // 🎬 DRAMA EPISODE
    // ===================================================
    if (category === "drama" && name === "episode") {

      const { id } = req.query;

      const r = await fetchWithTimeout(
        `https://anabot.my.id/api/search/drama/melolo/episode?series_id=${id}&apikey=freeApikey`
      );

      if (!r.success) return res.status(504).json(r);

      return sendResponse(res, "drama", "episode", null, r.data, r.ping);
    }

    // ===================================================
    // 🛠 SSWEB
    // ===================================================
    if (category === "tools" && name === "ssweb") {

      const { url, device = "windows", fullPage = "off" } = req.query;

      const r = await fetchWithTimeout(
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

    // ===================================================
    // 🛠 UNBAN
    // ===================================================
    if (category === "tools" && name === "unban") {

      const { number } = req.query;

      const r = await fetchWithTimeout(
        `https://api.yydz.biz.id/api/tools/unban?number=${encodeURIComponent(number)}&apikey=P5btAuX`
      );

      if (!r.success) return res.status(504).json(r);

      delete r.data?.data?.messageId;

      return sendResponse(res, "tools", "unban", null, r.data.data, r.ping);
    }

    // ===================================================
    // 📥 GDRIVE
    // ===================================================
    if (category === "download" && name === "gdrive") {

      const { url } = req.query;

      const r = await fetchWithTimeout(
        `https://anabot.my.id/api/download/gDrive?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );

      if (!r.success) return res.status(504).json(r);

      const result = r.data.data.result;

      return sendResponse(
        res,
        "download",
        "gdrive",
        "Google Drive",
        {
          name: result.name,
          download: result.download,
          original: result.link
        },
        r.ping
      );
    }

    // ===================================================
    // 📘 FACEBOOK
    // ===================================================
    if (category === "download" && name === "facebook") {

      const { url } = req.query;

      const r = await fetchWithTimeout(
        `https://anabot.my.id/api/download/facebook?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );

      if (!r.success) return res.status(504).json(r);

      const info = r.data?.data?.result?.api;

      return sendResponse(
        res,
        "download",
        "facebook",
        "Facebook",
        info,
        r.ping
      );
    }

    // ===================================================
    // 📸 INSTAGRAM
    // ===================================================
    if (category === "download" && name === "instagram") {

      const { url } = req.query;

      const r = await fetchWithTimeout(
        `https://anabot.my.id/api/download/instagram?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );

      if (!r.success) return res.status(504).json(r);

      const media = r.data?.data?.result || [];

      return sendResponse(
        res,
        "download",
        "instagram",
        "Instagram",
        media,
        r.ping
      );
    }

    // ===================================================
    // 🎵 TIKTOK
    // ===================================================
    if (category === "download" && name === "tiktok") {

      const { url } = req.query;

      const r = await fetchWithTimeout(
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

    // ===================================================
    // 🎬 CAPCUT
    // ===================================================
    if (category === "download" && name === "capcut") {

      const { url } = req.query;

      const r = await fetchWithTimeout(
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

    // ===================================================
    // 📦 SAVEWEB2ZIP
    // ===================================================
    if (category === "download" && name === "sitezip") {

      const { url } = req.query;

      const r = await fetchWithTimeout(
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
