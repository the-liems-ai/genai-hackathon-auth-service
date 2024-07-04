import { Context } from "hono"
import { GoogleUser, LoginRequest, Provider, providersMap } from "./dto"
import { env } from "hono/adapter"
import { Env } from "../../types"
import { google } from "worker-auth-providers"
import { BadRequestException } from "../../exception/Exception"
import { supabase } from "../../utils/supabase"
import { Tables } from "../../types/supabase"
import { createUser, getUser } from "../../repo/users"
import { generateToken, getUserFromToken } from "../../utils"

export const handleLogin = async (c: Context<{}, any, {}>) => {
    const { provider, redirectAfterLogin } = await c.req.json<LoginRequest>()

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

    let userData: Tables<"users">
    const data = await getUser(user.email, sp)

    if (!data || data.length === 0) {
        const { data: newData } = await createUser(user, sp)
        userData = newData![0]
    } else {
        userData = data![0]
    }

    const accessToken = await generateToken(userData, JWT_SECRET)

    return c.redirect(`${redirect}?token=${accessToken}`)
}

export const handleVerifyToken = async (c: Context<{}, "/:token", {}>) => {
    const { token } = c.req.param()

    if (!token) {
        throw new BadRequestException("Invalid request")
    }

    const { SUPABASE_URL, SUPABASE_KEY, JWT_SECRET } = env<typeof Env>(c)

    const user = await getUserFromToken(token, {
        SUPABASE_URL,
        SUPABASE_KEY,
        JWT_SECRET,
    })

    return c.json(user)
}
