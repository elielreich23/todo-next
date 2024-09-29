const spotifyError = class CustomSpotifyError extends Error {
    constructor(message) {
      super(message);
      this.statusCode = 422;
      this.name = "NotFoundError";
    }
}

const BadRequestError = class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
    this.name = "BadRequestError";
  }
}

module.exports = {spotifyError, BadRequestError}

  