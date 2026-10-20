export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode ?? 500;
  let message = err.isOperational ? err.message : "Internal server error";

  // Translate common Mongoose / MongoDB errors into client errors instead of opaque 500s.
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "A record with that value already exists";
  }

  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFound = (_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
};

export const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
};
