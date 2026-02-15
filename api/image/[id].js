export default async function handler(req, res) {

  try {

    const { id } = req.query;

    if (!id) return res.status(400).send("Missing id");

    // 🔥 decode base64 → URL asli
    const url = Buffer.from(id, "base64").toString("utf-8");

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(404).send("Image not found");
    }

    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");

    res.send(Buffer.from(buffer));

  } catch (err) {
    res.status(500).send("Error fetching image");
  }
}
