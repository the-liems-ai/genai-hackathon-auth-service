import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "../types/supabase"

export const getOrg = async (
    orgId: string,
    supabase: SupabaseClient<Database>
) => {
    return await supabase
        .from("organization")
        .select(
            `
        *,
        users:organization_users (
            is_owner,
            users (*)
        )
    `
        )
        .eq("id", orgId)
        .then(({ data }) => {
            return data?.map((org) => {
                return {
                    ...org,
                    users: org.users.map((user) => {
                        return {
                            ...user.users,
                            is_owner: user.is_owner,
                        }
                    }),
                }
            })
        })
}

export const createOrg = async (
    name: string,
    userId: number,
    supabase: SupabaseClient<Database>
) => {
    const { data } = await supabase
        .from("organization")
        .insert({
            name,
        })
        .select()
    const orgId = data![0].id

    await supabase.from("organization_users").insert({
        org_id: orgId,
        user_id: userId,
        is_owner: true,
    })

    return getOrg(orgId, supabase)
}

export const addUserToOrg = async (
    orgId: string,
    usersEmail: string[],
    supabase: SupabaseClient<Database>
) => {
    const { data } = await supabase
        .from("users")
        .select("id")
        .in("email", usersEmail)

    await supabase.from("organization_users").insert(
        data!.map((user) => ({
            org_id: orgId,
            user_id: user.id,
            is_owner: false,
        }))
    )

    return getOrg(orgId, supabase)
}

export const removeUserFromOrg = async (
    orgId: string,
    usersEmail: string[],
    supabase: SupabaseClient<Database>
) => {
    const usersId = await supabase
        .from("users")
        .select("id")
        .in("email", usersEmail)
        .then(({ data }) => data?.map((user) => user.id))

    await supabase
        .from("organization_users")
        .delete()
        .eq("org_id", orgId)
        .in("user_id", usersId!)

    return getOrg(orgId, supabase)
}

export const transferOwnership = async (
    orgId: string,
    fromUserId: number,
    toUserEmail: string,
    supabase: SupabaseClient<Database>
) => {
    await supabase
        .from("organization_users")
        .update({ is_owner: false })
        .eq("org_id", orgId)
        .eq("user_id", fromUserId)

    const toUserId = await supabase
        .from("users")
        .select("id")
        .eq("email", toUserEmail)
        .then(({ data }) => data![0].id)

    await supabase
        .from("organization_users")
        .update({ is_owner: true })
        .eq("org_id", orgId)
        .eq("user_id", toUserId)

    return getOrg(orgId, supabase)
}

export const deleteOrg = async (
    orgId: string,
    supabase: SupabaseClient<Database>
) => {
    await supabase.from("organization").delete().eq("id", orgId)

    return true
}
