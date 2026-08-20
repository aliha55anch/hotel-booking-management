declare global {
  namespace Express {
    interface AuthPayload {
      userId: string
    }

    interface AccountInfo {
      _id: string | import('mongoose').Types.ObjectId
      name?: string
      email: string
      image?: string
      role: string
      userModel: string
      password?: string
    }

    interface Request {
      auth?: AuthPayload
      user?: AccountInfo
    }
  }
}

export {}
