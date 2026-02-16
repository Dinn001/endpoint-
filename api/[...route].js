// ✅ TARUH DI SINI (PALING ATAS)

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
// 🚀 HANDLER
// ======================
export default async function handler(req, res) {

  try {

    const { apikey } = req.query;

    // 🔐 API KEY CHECK
    if (apikey !== "dinns_key") {
      return res.status(403).json({ error: "Invalid API key" });
    }

    // 🔥 AMBIL PATH DARI URL
    const path = req.url
      .replace(/^\/api\//, "")
      .split("?")[0]
      .split("/");

    const category = path[0];
    const name = path[1];

    // ======================
    // 🤖 AI CHAT
    // ======================

    if (category === "ai" && name === "chat") {

      const { q } = req.query;

      return res.json({
        success: true,
        reply: `Halo! Kamu bilang: ${q}`
      });
    }
// ======================
// 🤖 AI CICI
// ======================

if (category === "ai" && name === "cici") {

  const { prompt } = req.query;

  if (!prompt) {
    return res.status(400).json({ error: "prompt required" });
  }

  const r = await fetch(
    `https://anabot.my.id/api/ai/cici?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`
  );

  const data = await r.json();

  return res.json({
    success: true,
    author: "@dinns",
    request_id: generateId(16),
    source: "Dinnsstore",
    result: data.data.result
  });
}
// ======================
// 🧠 AI PERPLEXITY (DINNS)
// ======================

if (category === "ai" && name === "perplexity") {

  const { prompt } = req.query;

  if (!prompt) {
    return res.status(400).json({
      error: "Parameter prompt diperlukan"
    });
  }

  // 🔥 Ambil dari API luar (rahasia)
  const r = await fetch(
    `https://anabot.my.id/api/ai/perplexity?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`
  );

  const data = await r.json();

  const result = data?.data?.result;

  // 🔥 Output versi DINNS
  return res.json({
    success: true,
    api: "Dinns AI",
    model: "Perplexity",
    author: "@dinns",
    request_id: generateId(),
    answer: result?.gpt || null,
    sources: (result?.source || []).map(s => ({
      title: s.name,
      url: s.url
    }))
  });
}
    // ======================
// ⚡ AI TURBOSEEK (DINNS)
// ======================

if (category === "ai" && name === "turboseek") {

  const { prompt } = req.query;

  if (!prompt) {
    return res.status(400).json({
      error: "Parameter prompt diperlukan"
    });
  }

  const r = await fetch(
    `https://anabot.my.id/api/ai/turboseek?prompt=${encodeURIComponent(prompt)}&apikey=freeApikey`
  );

  const data = await r.json();
  const result = data?.data?.result;

  return res.json({
    success: true,
    api: "Dinns AI",
    model: "TurboSeek",
    author: "@dinns",
    request_id: generateId(),
    answer: result?.message || null,
    sources: result?.sources || [],
    related_questions: result?.similarQuestions || []
  });
}
    // ======================
// 🧠 AI DEEPAI (DINNS)
// ======================

if (category === "ai" && name === "deepai") {

  const { prompt, type } = req.query;

  if (!prompt || !type) {
    return res.status(400).json({
      error: "Parameter prompt dan type diperlukan"
    });
  }

  const r = await fetch(
    `https://anabot.my.id/api/ai/deepai?prompt=${encodeURIComponent(prompt)}&type=${encodeURIComponent(type)}&apikey=freeApikey`
  );

  const data = await r.json();
  const result = data?.data?.result?.result;

  return res.json({
    success: true,
    api: "Dinns AI",
    model: "DeepAI",
    mode: type,
    author: "@dinns",
    request_id: generateId(),
    answer: result || null
  });
}
    // ======================
    // 🎬 DRAMA SEARCH
    // ======================

    if (category === "drama" && name === "search") {

      const { q } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/search/drama/melolo/search?query=${encodeURIComponent(q)}&apikey=freeApikey`
      );

      return res.json(await r.json());
    }

    // ======================
    // 🎬 DRAMA EPISODE
    // ======================

    if (category === "drama" && name === "episode") {

      const { id } = req.query;

      const r = await fetch(
        `https://anabot.my.id/api/search/drama/melolo/episode?series_id=${id}&apikey=freeApikey`
      );

      return res.json(await r.json());
    }
// ======================
    // 🛠 TOOLS SSWEB
    // ======================
    if (category === "tools" && name === "ssweb") {

  const { url, device = "windows", fullPage = "off" } = req.query;

  const r = await fetch(
    `https://anabot.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&device=${encodeURIComponent(device)}&fullPage=${encodeURIComponent(fullPage)}&apikey=freeApikey`
  );

  const data = await r.json();

  const originalImage = data.data.result;

// 🔥 encode URL jadi base64
const encoded = Buffer.from(originalImage).toString("base64");

const proxyImage =
  `https://${req.headers.host}/api/image/${encoded}`;

  return res.json({
    success: true,
    author: "@dinns",
    request_id: generateId(16),
    image: `https://${proxyImage}`
  });
    }
    // ======================
    // 🛠 TOOLS UNBAN
    // ======================
if (category === "tools" && name === "unban") {

  const { number } = req.query;

  const r = await fetch(
    `https://api.yydz.biz.id/api/tools/unban?number=${encodeURIComponent(number)}&apikey=P5btAuX`
  );

  const data = await r.json();

  // 🔥 HAPUS messageId
  delete data.data.messageId;

  return res.json({
    status: data.status,
    author: "@dinns",
    request_id: generateId(16),
    source: "Dinns",
    data: data.data
  });
}

    // ======================
// 📥 DOWNLOAD GDRIVE
// ======================

if (category === "download" && name === "gdrive") {

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "url required" });
  }

  const r = await fetch(
    `https://anabot.my.id/api/download/gDrive?url=${encodeURIComponent(url)}&apikey=freeApikey`
  );

  const data = await r.json();

  const result = data.data.result;

  return res.json({
    success: true,
    author: "@dinns",
    request_id: generateId(16),
    source: "Dinnsstore",
    file: {
      name: result.name,
      download: result.download,
      original: result.link
    }
  });
}
    // ======================
// 📘 FACEBOOK DOWNLOAD
// ======================

if (category === "download" && name === "facebook") {

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "Parameter url diperlukan"
    });
  }

  const r = await fetch(
    `https://anabot.my.id/api/download/facebook?url=${encodeURIComponent(url)}&apikey=freeApikey`
  );

  const data = await r.json();

  const info = data?.data?.result?.api;

  return res.json({
    success: true,
    api: "Dinns Downloader",
    service: "Facebook",
    author: "@dinns",
    request_id: generateId(),

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

    media: info?.mediaItems?.map(m => ({
      type: m.type,
      quality: m.mediaQuality,
      resolution: m.mediaRes,
      size: m.mediaFileSize,
      format: m.mediaExtension,
      duration: m.mediaDuration,
      url: m.mediaUrl
    })) || []
  });
}

    // ======================
    // ❌ DEFAULT
    // ======================

    return res.status(404).json({
      error: "Endpoint not found",
      route: `${category}/${name}`
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
