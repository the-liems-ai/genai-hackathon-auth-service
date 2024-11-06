import { Hono } from "hono"
import { logger } from "hono/logger"
import { log } from "./config/logger"
import auth from "./controller/auth/route"
import org from "./controller/org/route"
import user from "./controller/user/route"
import { cors } from "hono/cors"

const app = new Hono()

app.use(logger(log))

app.use("/*", cors())

app.route("/", auth)

app.route("/org", org)

app.route("/user", user)

export default app
