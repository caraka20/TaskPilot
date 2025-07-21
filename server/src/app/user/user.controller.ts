import { Request, Response, NextFunction } from 'express'
import { createUser } from './user.service'
import { createUserSchema } from './user.schema'
import { ErrorResponse } from '../../utils/errorResponse'

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createUserSchema.parse(req.body)
    const user = await createUser(validatedData)
    res.status(201).json({ status: 'success', data: user })
  } catch (err) {
    next(err)
  }
}
