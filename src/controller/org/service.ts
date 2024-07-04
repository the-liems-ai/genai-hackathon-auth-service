import { Context } from "hono"
import { getUserFromHeader } from "../../utils"
import {
    BadRequestException,
    ForbiddenException,
} from "../../exception/Exception"
import {
    AddUserToOrgRequest,
    CreateOrgRequest,
    GetOrgRequestParams,
    RemoveUserFromOrgRequest,
    TransferOwnershipRequest,
    UpdateOrgRequest,
} from "./dto"
import {
    addUserToOrg,
    createOrg,
    deleteOrg,
    getOrg,
    removeUserFromOrg,
    transferOwnership,
    updateOrg,
} from "../../repo/org"
import { supabase } from "../../utils/supabase"
import { env } from "hono/adapter"
import { Env } from "../../types"
import { getUser } from "../../repo/users"

export const handleGetOrg = async (c: Context<{}, "/:orgId", {}>) => {
    const user = await getUserFromHeader(c)

    const { orgId } = c.req.param()

    const isBelongsToOrg = user.organizations.some((org) => org.id === orgId)

    if (!isBelongsToOrg) {
        throw new ForbiddenException(
            "You are not a member of this organization"
        )
    }
    const { SUPABASE_KEY, SUPABASE_URL } = env<typeof Env>(c)

    const sp = supabase(SUPABASE_URL, SUPABASE_KEY)

    return c.json(await getOrg(orgId, sp))
}

export const handleCreateOrg = async (c: Context<{}, "/:orgId", {}>) => {
    const user = await getUserFromHeader(c)

    const { name } = await c.req.json<CreateOrgRequest>()

    if (!name || name.trim() === "") {
        throw new BadRequestException("Invalid name")
    }

    const { SUPABASE_KEY, SUPABASE_URL } = env<typeof Env>(c)

    const sp = supabase(SUPABASE_URL, SUPABASE_KEY)

    return c.json(await createOrg(name, user.id, sp))
}

export const handleUpdateOrg = async (c: Context<{}, "/:orgId", {}>) => {
    const user = await getUserFromHeader(c)

    const { orgId } = c.req.param()

    const { name } = await c.req.json<UpdateOrgRequest>()

    if (!name || name.trim() === "") {
        throw new BadRequestException("Invalid name")
    }

    const isOwner = user.organizations.some(
        (org) => org.id === orgId && org.is_owner
    )

    if (!isOwner) {
        throw new ForbiddenException(
            "You are not an owner of this organization"
        )
    }

    const { SUPABASE_KEY, SUPABASE_URL } = env<typeof Env>(c)

    const sp = supabase(SUPABASE_URL, SUPABASE_KEY)

    return c.json(await updateOrg(orgId, name, sp))
}

export const handleAddUserToOrg = async (c: Context<{}, "/:orgId", {}>) => {
    const user = await getUserFromHeader(c)

    const { orgId } = c.req.param()

    const { usersEmail } = await c.req.json<AddUserToOrgRequest>()

    if (!Array.isArray(usersEmail) || usersEmail.length === 0) {
        throw new BadRequestException("Invalid email")
    }

    const isOwner = user.organizations.some(
        (org) => org.id === orgId && org.is_owner
    )

    if (!isOwner) {
        throw new ForbiddenException(
            "You are not an owner of this organization"
        )
    }

    const { SUPABASE_KEY, SUPABASE_URL } = env<typeof Env>(c)

    const sp = supabase(SUPABASE_URL, SUPABASE_KEY)

    return c.json(await addUserToOrg(orgId, usersEmail, sp))
}

export const handleRemoveUserFromOrg = async (
    c: Context<{}, "/:orgId", {}>
) => {
    const user = await getUserFromHeader(c)

    const { orgId } = c.req.param()

    const { usersEmail } = await c.req.json<RemoveUserFromOrgRequest>()

    if (!Array.isArray(usersEmail) || usersEmail.length === 0) {
        throw new BadRequestException("Invalid email")
    }

    const isOwner = user.organizations.some(
        (org) => org.id === orgId && org.is_owner
    )

    if (!isOwner) {
        throw new ForbiddenException(
            "You are not an owner of this organization"
        )
    }

    if (usersEmail.includes(user.email)) {
        throw new BadRequestException(
            "You can not remove yourself, transfer ownership first"
        )
    }

    const { SUPABASE_KEY, SUPABASE_URL } = env<typeof Env>(c)

    const sp = supabase(SUPABASE_URL, SUPABASE_KEY)

    return c.json(await removeUserFromOrg(orgId, usersEmail, sp))
}

export const handleLeaveOrg = async (c: Context<{}, "/:orgId", {}>) => {
    const user = await getUserFromHeader(c)

    const { orgId } = c.req.param()

    const isOwner = user.organizations.some(
        (org) => org.id === orgId && org.is_owner
    )

    if (isOwner) {
        throw new BadRequestException(
            "You can not leave organization, transfer ownership first"
        )
    }

    const isBelongsToOrg = user.organizations.some((org) => org.id === orgId)

    if (!isBelongsToOrg) {
        throw new ForbiddenException(
            "You are not a member of this organization"
        )
    }

    const { SUPABASE_KEY, SUPABASE_URL } = env<typeof Env>(c)

    const sp = supabase(SUPABASE_URL, SUPABASE_KEY)

    await removeUserFromOrg(orgId, [user.email], sp)

    return c.json(await getUser(user.email, sp))
}

export const handleTransferOwnership = async (
    c: Context<{}, "/:orgId", {}>
) => {
    const user = await getUserFromHeader(c)

    const { orgId } = c.req.param()

    const { newOwnerEmail } = await c.req.json<TransferOwnershipRequest>()

    const isOwner = user.organizations.some(
        (org) => org.id === orgId && org.is_owner
    )

    if (!isOwner) {
        throw new ForbiddenException(
            "You are not an owner of this organization"
        )
    }

    const { SUPABASE_KEY, SUPABASE_URL } = env<typeof Env>(c)

    const sp = supabase(SUPABASE_URL, SUPABASE_KEY)

    return c.json(await transferOwnership(orgId, user.id, newOwnerEmail, sp))
}

export const handleDeteOrg = async (c: Context<{}, "/:orgId", {}>) => {
    const user = await getUserFromHeader(c)

    const { orgId } = c.req.param()

    const isOwner = user.organizations.some(
        (org) => org.id === orgId && org.is_owner
    )

    if (!isOwner) {
        throw new ForbiddenException(
            "You are not an owner of this organization"
        )
    }

    const { SUPABASE_KEY, SUPABASE_URL } = env<typeof Env>(c)

    const sp = supabase(SUPABASE_URL, SUPABASE_KEY)

    await deleteOrg(orgId, sp)

    return c.json({ message: "Organization deleted" })
}
