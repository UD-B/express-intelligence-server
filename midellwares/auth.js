import fs from 'fs/promises'

export const validateUser = async (req, res, next) => {
    const username = req.headers.username
    const password = req.headers.password
    try {
        let data = await fs.readFile("./db/users.json", "utf-8")
        let users
        if (!data) {
            res.send("there aren't any users yet")
        } else {
            users = JSON.parse(data)
        }
        const user = users.find(user => user.username === username)
        if (!user) {
            res.send("no such user")
        } else {
            if (user.password === password) {
                next()
            } else {
                return res.json("incorrect password")
            }
        }
    } catch (error) {
        console.error(error.message);
    }
}