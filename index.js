import express from 'express';
import bodyParser from "body-parser";
import config from 'config';
import authRouter from './routes/authRoutes.js';
import ordersRouter from './routes/orderRoutes.js';
import goodsRouter from './routes/goodRoutes.js';
import cors from 'cors';
import fs from 'fs'
import https from 'https'

const privateKey = fs.readFileSync('./keys/privkey.pem','utf8')
const certificate = fs.readFileSync('./keys/cert.pem','utf8')
const ca = fs.readFileSync('./keys/chain.pem','utf8')

const credentials = {
    key: privateKey,
    cert: certificate,
    ca
}

const app = express();
const PORT = config.get("serverPort")
const sPORT = 5000

app.use(cors())
app.use(bodyParser.urlencoded({
    extended: true,
}))
app.use(bodyParser.json())

app.use("/api/auth/", authRouter)
app.use("/api/orders/", ordersRouter)
app.use("/api/goods/", goodsRouter)
app.get("/", (req, res) => {
    res.status(200).json({message: 'hello'})
})

app.listen(PORT , ()=> {
    console.log("Сервер успешно запущен на порту " + PORT + '...')
})

const httpsServer = https.createServer(credentials, app)
httpsServer.listen(sPORT, () => {
    console.log('HTTPS server started on port ' + sPORT + '...')
})
