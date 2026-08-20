import mongoose from 'mongoose'

const connectDB = async (): Promise<typeof mongoose> => {
  const conn = await mongoose.connect(process.env.MONGO_URI!)
  console.log(`MongoDB Connected: ${conn.connection.host}`)
  return conn
}

export = connectDB
