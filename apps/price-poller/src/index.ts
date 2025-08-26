import express from 'express'
import http from 'http'
import dotenv from 'dotenv'

dotenv.config()
const PORT = process.env.PORT
const app = express();
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log("app is listening at port ", PORT)
})