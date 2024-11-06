import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "../types/supabase"
import { GoogleUser } from "../controller/auth/dto"

export const getUsers = async (
    keyword: string,
    supabase: SupabaseClient<Database>
) => {
    return await supabase
        .from("users")
        .select("*")
        .like("email", `%${keyword}%`)
}

export const getUser = async (
    email: string,
    supabase: SupabaseClient<Database>
) => {
    return await supabase
        .from("users")
        .select(
            `*,
        organizations:organization_users (
            is_owner,
            organization (*)
        )
    `
        )
        .eq("email", email)
        .then(({ data }) => {
            return data?.map((user) => {
                return {
                    ...user,
                    organizations: user.organizations.map((org) => {
                        return {
                            ...org.organization,
                            is_owner: org.is_owner,
                        }
                    }),
                }
            })
        })
}

export const createUser = async (
    user: GoogleUser,
    supabase: SupabaseClient<Database>
) => {
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
