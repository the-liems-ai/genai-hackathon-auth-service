import { Context } from "hono"
import { env } from "hono/adapter"
import { Env } from "../../types"
import { supabase } from "../../utils/supabase"
import { getUsers } from "../../repo/users"

export const handleGetUsers = async (c: Context<{}, any, {}>) => {
    const { keyword } = c.req.query()

    const { SUPABASE_KEY, SUPABASE_URL } = env<typeof Env>(c)

    const sp = supabase(SUPABASE_URL, SUPABASE_KEY)

    return c.json(await getUsers(keyword, sp))
}
