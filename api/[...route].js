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
    // 🛠 TOOLS UNBAN
    // ======================

    if (category === "tools" && name === "unban") {

      const { number } = req.query;

      const r = await fetch(
        `https://api.yydz.biz.id/api/tools/unban?number=${encodeURIComponent(number)}&apikey=free`
      );

      return res.json(await r.json());
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
