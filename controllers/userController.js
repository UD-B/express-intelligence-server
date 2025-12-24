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
