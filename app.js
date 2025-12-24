import express from 'express'
import fs from 'fs/promises'
import { validateUser } from './midellwares/auth.js'
import { createUsers, getUsers } from './controllers/userController.js'
import usersRouter from './routers/usersRouter.js'

const app = express()

app.use(express.json())
app.use("/users", usersRouter)

const port = 3003

app.get("/", (req, res) => {
    res.send(`server is running on port: ${port}`)
})

app.get("/health", (req, res) => {
    res.send({ ok: true })
})

app.get("/users", validateUser, getUsers)
app.post("/users", validateUser, createUsers)


app.put('/users/:username', async (req, res) => {
    try {
        const username = req.params.username
        let result = await readFile('./db/users.json', 'utf-8')
        let data;
        if (!result) {
            data = []
        } else {

        }
    } catch (error) {
        console.error(error.message);
    }
})









app.listen(port, () => {
    console.log(`server is running on port: ${port}`)
})