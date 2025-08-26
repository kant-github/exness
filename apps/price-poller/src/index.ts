import express from 'express'
import http from 'http'
import dotenv from 'dotenv'
import WebSocketInstance from './socket/WebSocketInstance'

dotenv.config()
const PORT = process.env.PORT
const app = express();
const server = http.createServer(app);

new WebSocketInstance()

server.listen(PORT, () => {
    console.log("app is listening at port ", PORT)
})