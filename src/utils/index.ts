import { sign, verify } from "hono/jwt"
import { supabase } from "./supabase"
import { tokenExpries } from "../config/constant"
import { Tables } from "../types/supabase"
import { getUser } from "../repo/users"
import { BadRequestException } from "../exception/Exception"
import { Env, Payload } from "../types"
import { Context } from "hono"
import { env } from "hono/adapter"

export const generateToken = async (user: Tables<"users">, secret: string) => {
    const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        exp: tokenExpries,
    }
    return await sign(payload, secret)
}

export const getUserFromToken = async (
    token: string,
    secrets: {
        SUPABASE_URL: string
        SUPABASE_KEY: string
        JWT_SECRET: string
    }
) => {
    try {
        const { email }: Payload = await verify(token, secrets.JWT_SECRET)

        const sp = supabase(secrets.SUPABASE_URL, secrets.SUPABASE_KEY)

        const data = await getUser(email, sp)

        return data![0]
    } catch (e) {
        throw new BadRequestException("Invalid token")
    }
}

export const getTokenFromHeader = (c: Context<{}, any, {}>) => {
    return c.req.header("Authorization")?.split(" ")[1]
}

export const getUserFromHeader = (c: Context<{}, any, {}>) => {
    const token = getTokenFromHeader(c)
    if (!token) {
        throw new BadRequestException("Invalid token")
    }
    const { SUPABASE_URL, SUPABASE_KEY, JWT_SECRET } = env<typeof Env>(c)
    return getUserFromToken(token, {
        SUPABASE_URL,
        SUPABASE_KEY,
        JWT_SECRET,
    })
}
