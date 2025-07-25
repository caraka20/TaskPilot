import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cors from 'cors'
import { publicRouter } from './routes/public-api' 
import { errorHandler } from './middleware/error-handler'

const app = express()
app.use(express.json())
app.use(cors())

app.use(publicRouter)
app.use(errorHandler)
// app.use(express.urlencoded({ extended: true }))
// app.use(helmet())
// app.use(morgan('dev'))



export default app