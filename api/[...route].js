export default async function handler(req, res) {

  try {

    const { route, apikey, ...params } = req.query;

    // 🔐 API KEY (opsional)
    if (apikey && apikey !== "dinns_key") {
      return res.status(403).json({ error: "Invalid API key" });
    }

    if (!route || route.length < 2) {
      return res.status(400).json({ error: "Invalid route" });
    }

    const [category, name] = route;

    // =========================
    // 🎬 DRAMA — MELOLO
    // =========================

    if (category === "drama" && name === "search") {

      const r = await fetch(
        `https://anabot.my.id/api/search/drama/melolo/search?query=${encodeURIComponent(params.q)}&apikey=freeApikey`
      );

      return res.json(await r.json());
    }

    if (category === "drama" && name === "episode") {

      const r = await fetch(
        `https://anabot.my.id/api/search/drama/melolo/episode?series_id=${params.id}&apikey=freeApikey`
      );

      return res.json(await r.json());
    }

    // =========================
    // 🛠 TOOLS
    // =========================

    if (category === "tools" && name === "unban") {

      const r = await fetch(
        `https://api.yydz.biz.id/api/tools/unban?number=${encodeURIComponent(params.number)}&apikey=free`
      );

      return res.json(await r.json());
    }

    if (category === "tools" && name === "ssweb") {

      return res.json({
        success: true,
        screenshot: "https://example.com/image.png",
        target: params.url
      });
    }

    // =========================
    // 🤖 AI (Dummy)
    // =========================

    if (category === "ai" && name === "chat") {

      return res.json({
        success: true,
        reply: "Halo dari Dinns AI",
        question: params.q
      });
    }

    // =========================
    // 📥 DOWNLOAD (Dummy)
    // =========================

    if (category === "download" && name === "tiktok") {

      return res.json({
        success: true,
        video: "https://example.com/video.mp4"
      });
    }

    // =========================
    // 🍥 ANIME (Dummy)
    // =========================

    if (category === "anime" && name === "search") {

      return res.json({
        success: true,
        result: ["Naruto", "One Piece", "Attack on Titan"]
      });
    }

    return res.status(404).json({ error: "Endpoint not found" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
