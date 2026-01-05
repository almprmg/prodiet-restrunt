// config/config.js
require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || "abduljabbar",
    password: process.env.DB_PASS || "abduljabbar@123",
    database: process.env.DB_NAME || "prodiet_test2",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
  },

  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: (process.env.DB_NAME || "prodiet") + "_test2",
    host: process.env.DB_HOST,
    dialect: "postgres",
  },

  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "postgres",
  },
};
