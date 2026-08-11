const { cpSync, existsSync, mkdirSync, rmSync } = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const source = path.join(projectRoot, 'src', 'generated', 'prisma')
const target = path.join(projectRoot, 'dist', 'src', 'generated', 'prisma')

if (!existsSync(source)) {
  throw new Error('Prisma Client belum dibuat. Jalankan: npx prisma generate')
}

rmSync(target, { recursive: true, force: true })
mkdirSync(path.dirname(target), { recursive: true })
cpSync(source, target, { recursive: true })

console.log('Prisma Client copied to dist/src/generated/prisma')
