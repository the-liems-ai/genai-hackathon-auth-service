import { Context, Hono } from "hono"
import {
    handleGoogleCallback,
    handleLogin,
    handleVerifyToken,
    // testSupabase,
} from "./service"

const app = new Hono()

app.post("/login", async (c: Context<{}, any, {}>) => {
    return await handleLogin(c)
})

app.get("/callback", async (c: Context<{}, any, {}>) => {
    return await handleGoogleCallback(c)
})

app.post("/verify", async (c: Context<{}, any, {}>) => {
    return await handleVerifyToken(c)
})

// app.get("/test", async (c: Context<{}, any, {}>) => {
//     return await testSupabase(c)
// })
export default app
