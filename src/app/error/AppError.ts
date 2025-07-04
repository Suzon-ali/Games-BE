class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string, stack: '') {
    super(message);
    this.statusCode = statusCode;

    if (stack && stack !== '') {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
