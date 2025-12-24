import express from 'express'
import fs from 'fs/promises'
import { validateUser } from './midellwares/auth.js'
import { getUsers } from './controllers/userController.js'
const app = express()
app.use(express.json())
const port = 3003


app.get("/", (req, res) => {
    res.send(`server is running on port: ${port}`)
})

app.get("/health", (req, res) => {
    res.send({ ok: true })
})


app.get("/users", validateUser, getUsers)

app.post("/users", async (req, res) => {
    try {
        let result = await fs.readFile('./db/users.json', "utf-8")
        let data;
        if (!result) {
            data = []
        } else {
            data = JSON.parse(result)
        }
        const { username, password } = req.body
        const isTaken = data.find((user) => user.username === username)
        if (!username || !password) {
            res.send("invalid body")
        } else if (isTaken) {
            res.send("username is already taken")
        } else {
            const newObj = req.body
            data.push(newObj)
            await fs.writeFile('./db/users.json', JSON.stringify(data, null, 4))
            res.send(data)
        }
    } catch (error) {
        console.error(error.message);
        res.send(error.message)
    }
})

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

    }
})









app.listen(port, () => {
    console.log(`server is running on port: ${port}`)
})