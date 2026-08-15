import express from 'express'
import cors from 'cors'
import { route } from './routes/public-api'
import { errorHandler } from './middleware/error-handler'
import { attendanceRouter } from './attendance/attendance.routes'
import { uploadRoot } from './config/uploads'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadRoot, {
  fallthrough: false,
  immutable: true,
  maxAge: '7d',
}))

// Routing
app.use(route)
app.use('/api/attendance', attendanceRouter)

// Error handler
app.use(errorHandler)

export default app
