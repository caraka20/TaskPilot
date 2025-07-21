import { Router } from 'express'
import userRoute from '../app/user/user.route'

const router = Router()

router.use('/users', userRoute)

export default router
