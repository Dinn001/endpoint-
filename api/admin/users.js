import { API_USERS } from "../../lib/database.js";

export default function handler(req, res) {

  const { apikey } = req.query;

  const owner = API_USERS[apikey];

  if (!owner || owner.role !== "owner") {
    return res.status(403).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const data = Object.entries(API_USERS).map(([key, u]) => ({
    key,
    name: u.name,
    role: u.role,
    limit: u.limit,
    used: u.used,
    active: u.active !== false
  }));

  res.json({
    success: true,
    total: data.length,
    data
  });
}
