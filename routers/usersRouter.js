import express from 'express'

const router = express.Router();

router.get('/ud', (req, res) => {
    res.send("you're in users/ud route")
})

export default router 