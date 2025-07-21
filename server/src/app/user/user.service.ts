import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { CreateUserDTO } from './user.dto'

export const createUser = async (data: CreateUserDTO) => {
  const { email, password, namaLengkap, role } = data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('User already exists')

  const newUser = await prisma.user.create({
    data: {
      email,
      password, // idealnya di-hash dulu
      namaLengkap,
      role: role ?? 'USER'
    }
  })

  return newUser
}
