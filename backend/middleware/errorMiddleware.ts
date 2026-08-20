import { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
  statusCode?: number
  errors?: Record<string, { message: string }>
}

const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  next(error)
}

const errorHandler = (err: AppError, _req: Request, res: Response, _next: NextFunction): void => {
  let statusCode =
    err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500)
  let message = err.message

  if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid id format'
  }

  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ')
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export { notFound, errorHandler }
