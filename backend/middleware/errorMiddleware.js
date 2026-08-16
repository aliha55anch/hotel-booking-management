const notFound = (req, res, next) => {
  res.status(404)
  next(new Error(`Not Found - ${req.originalUrl}`))
}

const errorHandler = (err, req, res, next) => {
  let statusCode =
    err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500)
  let message = err.message

  if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid id format'
  }

  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ')
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = { notFound, errorHandler }
