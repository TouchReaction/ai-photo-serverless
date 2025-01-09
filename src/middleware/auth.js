const { logger } = require("../config/logger");

const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    logger.warn("API request without key");
    return res
      .status(401)
      .json({ success: false, error: "API key is required" });
  }

  if (apiKey !== process.env.API_KEY) {
    logger.warn(`Invalid API key used: ${apiKey}`);
    return res.status(401).json({ success: false, error: "Invalid API key" });
  }

  next();
};

module.exports = { apiKeyAuth };
