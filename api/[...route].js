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

  const proxyImage =
    `${req.headers.host}/api/image?url=${encodeURIComponent(originalImage)}`;

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
