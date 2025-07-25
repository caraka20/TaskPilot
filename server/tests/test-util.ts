import { prismaClient } from "../src/config/database";
import bcrypt from "bcrypt"

export class UserTest {
    static async create () {
        const hashPassword = await bcrypt.hash("raka20", 10)
        await prismaClient.user.create({
            data : {
                username : "raka20",
                password : hashPassword,
                namaLengkap : "caraka"
            }
        })
    }

    static async delete () {
        await prismaClient.user.deleteMany({
            where : {
                username : "raka20",
            }
        })
    }
}