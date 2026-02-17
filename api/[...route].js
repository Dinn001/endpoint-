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
function sendResponse(res, category, endpoint, model, data) {
  return res.json({
    success: true,
    api: "Dinns API",
    base_url: "https://endpoint-dinns.vercel.app",

    category,
    endpoint,
    model: model || null,

    author: "@dinns",
    request_id: generateId(),

    data
  });
}

// ======================
// 🚀 HANDLER
// ======================
export default async function handler(req, res) {
  try {

    const { apikey } = req.query;

    // 🔐 API KEY CHECK
    if (apikey !== "dinns_key") {
      return res.status(403).json({
        success: false,
        error: "Invalid API key"
      });
    }

    // 🔥 GET PATH
    const path = req.url
      .replace(/^\/api\//, "")
      .split("?")[0]
      .split("/");

    const category = path[0];
    const name = path[1];

    // ===================================================
    // 🤖 AI CHAT
    // ===================================================
    if (category === "ai" && name === "chat") {
      const { q } = req.query;

      return sendResponse(
        res,
        "ai",
        "chat",
        "Dinns AI",
        { reply: `Halo! Kamu bilang: ${q}` }
      );
    }

    // ===================================================
    // 🤖 CICI
    // ===================================================
    if (category === "ai" && name === "cici") {

      const { prompt } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/ai/cici?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`
      );

      const data = await r.json();

      return sendResponse(
        res,
        "ai",
        "cici",
        "Dinns AI",
        { result: data.data.result }
      );
    }

    // ===================================================
    // 🧠 PERPLEXITY
    // ===================================================
    if (category === "ai" && name === "perplexity") {

      const { prompt } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/ai/perplexity?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`
      );

      const data = await r.json();
      const result = data?.data?.result;

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
        }
      );
    }

    // ===================================================
    // ⚡ TURBOSEEK
    // ===================================================
    if (category === "ai" && name === "turboseek") {

      const { prompt } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/ai/turboseek?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`
      );

      const data = await r.json();
      const result = data?.data?.result;

      return sendResponse(
        res,
        "ai",
        "turboseek",
        "TurboSeek",
        {
          answer: result?.message || null,
          sources: result?.sources || [],
          related_questions: result?.similarQuestions || []
        }
      );
    }

    // ===================================================
    // 🧠 DEEPAI
    // ===================================================
    if (category === "ai" && name === "deepai") {

      const { prompt, type } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/ai/deepai?prompt=${encodeURIComponent(prompt)}&type=${encodeURIComponent(type)}&apikey=freeApikey`
      );

      const data = await r.json();
      const result = data?.data?.result?.result;

      return sendResponse(
        res,
        "ai",
        "deepai",
        "DeepAI",
        {
          mode: type,
          answer: result || null
        }
      );
    }

    // ===================================================
    // 🎬 DRAMA SEARCH
    // ===================================================
    if (category === "drama" && name === "search") {

      const { q } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/search/drama/melolo/search?query=${encodeURIComponent(q)}&apikey=freeApikey`
      );

      const result = await r.json();

      return sendResponse(res, "drama", "search", null, result);
    }

    // ===================================================
    // 🎬 DRAMA EPISODE
    // ===================================================
    if (category === "drama" && name === "episode") {

      const { id } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/search/drama/melolo/episode?series_id=${id}&apikey=freeApikey`
      );

      const result = await r.json();

      return sendResponse(res, "drama", "episode", null, result);
    }

    // ===================================================
    // 🛠 SSWEB
    // ===================================================
    if (category === "tools" && name === "ssweb") {

      const { url, device = "windows", fullPage = "off" } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&device=${device}&fullPage=${fullPage}&apikey=freeApikey`
      );

      const data = await r.json();

      return sendResponse(
        res,
        "tools",
        "ssweb",
        null,
        { image: data.data.result }
      );
    }

    // ===================================================
    // 🛠 UNBAN
    // ===================================================
    if (category === "tools" && name === "unban") {

      const { number } = req.query;

      const r = await fetch(
        `https://api.yydz.biz.id/api/tools/unban?number=${encodeURIComponent(number)}&apikey=P5btAuX`
      );

      const data = await r.json();

      delete data.data.messageId;

      return sendResponse(
        res,
        "tools",
        "unban",
        null,
        data.data
      );
    }

    // ===================================================
    // 📥 GDRIVE
    // ===================================================
    if (category === "download" && name === "gdrive") {

      const { url } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/download/gDrive?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );

      const data = await r.json();
      const result = data.data.result;

      return sendResponse(
        res,
        "download",
        "gdrive",
        "Google Drive",
        {
          name: result.name,
          download: result.download,
          original: result.link
        }
      );
    }

    // ===================================================
    // 📘 FACEBOOK
    // ===================================================
    if (category === "download" && name === "facebook") {

      const { url } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/download/facebook?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );

      const data = await r.json();
      const info = data?.data?.result?.api;

      return sendResponse(
        res,
        "download",
        "facebook",
        "Facebook",
        {
          post: {
            id: info?.id,
            title: info?.title,
            description: info?.description,
            preview: info?.imagePreviewUrl,
            permanent_link: info?.permanentLink
          },
          user: info?.userInfo ? {
            name: info.userInfo.name,
            username: info.userInfo.username,
            avatar: info.userInfo.userAvatar,
            verified: info.userInfo.isVerified
          } : null,
          media: info?.mediaItems || []
        }
      );
    }

    // ===================================================
    // 📸 INSTAGRAM
    // ===================================================
    if (category === "download" && name === "instagram") {

      const { url } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/download/instagram?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );

      const data = await r.json();
      const media = data?.data?.result || [];

      return sendResponse(
        res,
        "download",
        "instagram",
        "Instagram",
        {
          total_media: media.length,
          media: media.map((m, i) => ({
            id: i + 1,
            thumbnail: m.thumbnail,
            download: m.url
          }))
        }
      );
    }

    // ===================================================
    // 🎵 TIKTOK
    // ===================================================
    if (category === "download" && name === "tiktok") {

      const { url } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=freeApikey`
      );

      const data = await r.json();
      const result = data?.data?.result || {};

      return sendResponse(
        res,
        "download",
        "tiktok",
        "TikTok",
        {
          creator: result.username || null,
          description: result.description || null,
          media: {
            thumbnail: result.thumbnail || null,
            video_hd: result.video || null,
            video_no_watermark: result.nowatermark || null,
            audio_mp3: result.audio || null
          }
        }
      );
    }

    // ===================================================
    // ❌ DEFAULT
    // ===================================================
    return res.status(404).json({
      success: false,
      error: "Endpoint not found",
      route: `${category}/${name}`
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
        }
