import { Context, Hono } from "hono"
import {
    handleAddUserToOrg,
    handleCreateOrg,
    handleDeteOrg,
    handleGetOrg,
    handleLeaveOrg,
    handleRemoveUserFromOrg,
    handleTransferOwnership,
    handleUpdateOrg,
} from "./service"

const app = new Hono()

app.get("/:orgId", async (c: Context<{}, "/:orgId", {}>) => {
    return await handleGetOrg(c)
})

app.post("/", async (c: Context<{}, any, {}>) => {
    return await handleCreateOrg(c)
})

app.put("/:orgId", async (c: Context<{}, "/:orgId", {}>) => {
    return await handleUpdateOrg(c)
})

app.put("/:orgId/add", async (c: Context<{}, any, {}>) => {
    return await handleAddUserToOrg(c)
})

app.put("/:orgId/remove", async (c: Context<{}, any, {}>) => {
    return await handleRemoveUserFromOrg(c)
})

app.put("/:orgId/leave", async (c: Context<{}, any, {}>) => {
    return await handleLeaveOrg(c)
})

app.put("/:orgId/transfer", async (c: Context<{}, any, {}>) => {
    return await handleTransferOwnership(c)
})

app.delete("/:orgId", async (c: Context<{}, any, {}>) => {
    return await handleDeteOrg(c)
})

export default app
