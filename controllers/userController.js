import fs from 'fs/promises'

export const getUsers = async (req, res) => {
    try {
        let result = await fs.readFile('./db/users.json', "utf-8")
        let data
        if (!result) {
            res.send("there are'nt any users yet")
        } else {
            data = JSON.parse(result)
            res.json(data)
        }
    } catch (error) {
        console.error(error.message)
        res.json(error.message)
    }
}

export const createUsers = async (req, res) => {
    try {
        let result = await fs.readFile('./db/users.json', "utf-8")
        let data
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
        console.error(error.message)
        res.send(error.message)
    }
}

export const editUsers = async (req, res) => {
    try {
        const username = req.params.username
        let result = await fs.readFile('./db/users.json', 'utf-8')
        let data = JSON.parse(result)
        const userExists = data.find(user => user.username === username)
        if (userExists) {
            const newPassword = req.body.password
            if (newPassword) {
                userExists.password = newPassword
                await fs.writeFile('./db/users.json', JSON.stringify(data, null, 4))
            }else{
                res.send("no password field provided")
            }
        }else{
            res.send("user doesn't exist")
        }
    } catch (error) {
        console.error(error.message);
    }
}