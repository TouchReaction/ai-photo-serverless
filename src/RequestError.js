module.exports = class RequestError extends Error {
  constructor(msg) {
    super(msg);
  }
};
