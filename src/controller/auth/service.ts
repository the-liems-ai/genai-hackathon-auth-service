import { Context } from "hono"
import {
    GoogleUser,
    LoginRequest,
    Payload,
    Provider,
    providersMap,
} from "./dto"
import { env } from "hono/adapter"
import { Env } from "../../types"
import { google } from "worker-auth-providers"
import { BadRequestException } from "../../exception/BadRequestException"
import { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "../../utils/supabase"
import { Database } from "../../types/supabase"
import { sign, verify } from "hono/jwt"
import { tokenExpries } from "../../config/constant"

export const handleLogin = async (c: Context<{}, any, {}>) => {
    const { provider, redirectAfterLogin }: LoginRequest = await c.req.json()

    if (!provider || !redirectAfterLogin) {
        throw new BadRequestException("Invalid request")
    }

    let redirectUrl = ""

    const { GOOGLE_CLIENT_ID, SERVICE_URL } = env<typeof Env>(c)

    switch (providersMap[provider]) {
        case Provider.GOOGLE:
            redirectUrl = await google.redirect({
                options: {
                    clientId: GOOGLE_CLIENT_ID,
                    redirectTo: `${SERVICE_URL}/callback`,
                    state: redirectAfterLogin,
                },
            })
            break
        default:
            throw new BadRequestException("Invalid provider")
    }

    console.log(`Google auth: ${redirectUrl}`)
    return c.json(
        {
            url: redirectUrl,
            code: 302,
        },
        302
    )
}

export const handleGoogleCallback = async (c: Context<{}, any, {}>) => {
    const request = c.req.raw
    const { state: redirect } = c.req.query()

    const {
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        SERVICE_URL,
        SUPABASE_URL,
        SUPABASE_KEY,
        JWT_SECRET,
    } = env<typeof Env>(c)

    const { user }: { user: GoogleUser } = await google.users({
        options: {
            clientSecret: GOOGLE_CLIENT_SECRET,
            clientId: GOOGLE_CLIENT_ID,
            redirectUrl: `${SERVICE_URL}/callback`,
        },
        request,
    })

    const sp = supabase(SUPABASE_URL, SUPABASE_KEY)

    let userData = {}
    const { data } = await getUser(user.email, sp)

    if (!data || data.length === 0) {
        const { data: newData } = await createUser(user, sp)
        userData = newData![0]
    } else {
        userData = data![0]
    }

    const accessToken = await generateToken(userData, JWT_SECRET)

    return c.redirect(`${redirect}?token=${accessToken}`)
}

export const handleVerifyToken = async (c: Context<{}, any, {}>) => {
    const { token } = await c.req.json()

    if (!token) {
        throw new BadRequestException("Invalid request")
    }

    const { SUPABASE_URL, SUPABASE_KEY, JWT_SECRET } = env<typeof Env>(c)

    try {
        const { email }: Payload = await verify(token, JWT_SECRET)

        const sp = supabase(SUPABASE_URL, SUPABASE_KEY)

        const { data } = await getUser(email, sp)

        return c.json(data![0])
    } catch (e) {
        throw new BadRequestException("Invalid token")
    }
}

const generateToken = async (user: any, secret: string) => {
    const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        exp: tokenExpries,
    }
    return await sign(payload, secret)
}

const getUser = async (email: string, supabase: SupabaseClient) => {
    return await supabase.from("users").select("*").eq("email", email)
}

const createUser = async (user: any, supabase: SupabaseClient<Database>) => {
    return await supabase
        .from("users")
        .insert({
            email: user.email,
            name: user.name,
            given_name: user.given_name,
            family_name: user.family_name,
            picture: user.picture,
            locale: user.locale,
        })
        .select("*")
}
