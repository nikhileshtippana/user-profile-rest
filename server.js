const express = require('express')
const mongoose = require('mongoose')
const userRouter = require('./routes/users')
const app = express()
app.use(express.json())

const MONGO_USER = process.env.MONGO_USER
const MONGO_PASS = process.env.MONGO_PASS
const MONGO_URL = process.env.MONGO_URL
let DB_URL = 'mongodb://localhost:27017/user_profile'

if (MONGO_USER && MONGO_PASS && MONGO_URL ) {
    DB_URL = `mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_URL}`
}
mongoose.connect(DB_URL).catch(err => { console.error(err) })

app.get('/status', (req, res) => {
    if (mongoose.connection.readyState === 1) {
        res.send('UP')
    } else {
        res.status(503).send()
    }
})

// Routers
app.use('/users', userRouter)

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Listening on port ${port}`))