const bcrypt = require("bcryptjs");

const hash = "$2b$10$3BnXTZ1k3FiOJOP9PrUy.O9jtfYc7v3brdllOYijdjzZxBTWEIiNy";
const password = "Yashas@1234";

bcrypt.compare(password, hash).then(match => {
  console.log("Password match result:", match);
}).catch(err => {
  console.error("Bcrypt error:", err);
});
