import { Context, Hono } from "hono"
import { handleGoogleCallback, handleLogin, handleVerifyToken } from "./service"

const app = new Hono()

app.post("/login", async (c: Context<{}, any, {}>) => {
    return await handleLogin(c)
})

app.get("/callback", async (c: Context<{}, any, {}>) => {
    return await handleGoogleCallback(c)
})

app.get("/verify/:token", async (c: Context<{}, "/:token", {}>) => {
    return await handleVerifyToken(c)
})

export default app
