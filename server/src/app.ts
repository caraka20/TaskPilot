import express from 'express'
import cors from 'cors'
import { route } from './routes/public-api'
import { errorHandler } from './middleware/error-handler'

const app = express()

app.use(cors())
app.use(express.json())

// Routing
app.use(route)

// Error handler
app.use(errorHandler)

export default app
