import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cors from 'cors'
import router from './routes'
import { errorHandler } from './middleware/error.middleware'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))

app.use('/api', router)

app.use(errorHandler)

export default app
