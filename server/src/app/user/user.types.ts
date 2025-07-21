export type UserRole = 'OWNER' | 'USER'

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}
