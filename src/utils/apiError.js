class apiError extends Error {
  constructor(
    statusCode,
    message = " Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    // the following are our custom properties that we can use to send a response to the client.
    this.statusCode = statusCode;
    this.errors = errors;
    this.stack = stack;
    this.data = null;
    this.success = false;
    this.message = message;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { apiError };
