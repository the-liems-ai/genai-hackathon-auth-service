import { Context, Hono } from "hono"
import { handleGetUsers } from "./service"

const app = new Hono()

app.get("/", async (c: Context<{}, any, {}>) => {
    return await handleGetUsers(c)
})

export default app
