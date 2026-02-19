// ======================
// 🧠 DATABASE API USERS
// ======================
export const API_USERS = {

  "dinns_key": {
    name: "Dinns Owner",
    role: "owner",
    limit: "unlimited",
    used: 0
  },

  "free_key_1": {
    name: "Free User 1",
    role: "free",
    limit: 100,
    used: 0
  },

  "free_key_2": {
    name: "Free User 2",
    role: "free",
    limit: 100,
    used: 0
  },

  "premium_key_1": {
    name: "Premium User 1",
    role: "premium",
    limit: 1000,
    used: 0
  },

  "premium_key_2": {
    name: "Premium User 2",
    role: "premium",
    limit: 5,
    used: 0
  }

};

export default function handler(req, res) {
  res.status(200).json({
    success: true,
    api: "Dinns API",
    data: API_USERS
  });
}
