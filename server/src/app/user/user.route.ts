import { Router } from 'express'
import { registerUser } from './user.controller'

const router = Router()

router.post('/register', registerUser)

export default router
