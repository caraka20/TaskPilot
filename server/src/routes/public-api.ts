import express from "express"
import { UserController } from "../app/user/user.controller"
import { GajiController } from "../app/gaji/gaji.controller"
import { authMiddleware } from "../middleware/auth-middleware"

export const publicRouter = express.Router()

// USER
publicRouter.post("/api/users/register", UserController.register)
publicRouter.post("/api/users/login", UserController.login)
publicRouter.get('/api/users', UserController.getAllUsers)
publicRouter.get('/api/users/:username', UserController.getUserDetail)
publicRouter.post("/api/users/logout",authMiddleware, UserController.logout)

// GAJI
publicRouter.post('/api/gaji', GajiController.createGaji)
