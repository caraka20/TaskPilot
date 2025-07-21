export interface CreateUserDTO {
  email: string
  password: string
  namaLengkap: string
  role?: 'ADMIN' | 'USER'
}
