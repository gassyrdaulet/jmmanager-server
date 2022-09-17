import express from 'express';
import bodyParser from "body-parser";
import OrderService from './service/OrderService.js';
import conn from './db.js';
import config from 'config';
import authRouter from './routes/authRoutes.js';
import ordersRouter from './routes/orderRoutes.js';
import goodsRouter from './routes/goodRoutes.js';
import {auth} from './middleware/routerSecurity.js';
import cors from 'cors';

const app = express();

const PORT = config.get("serverPort")

app.use(cors())
app.use(bodyParser.urlencoded({
    extended: true,
}))
app.use(bodyParser.json())

app.use("/api/auth/", authRouter)
app.use("/api/orders/", ordersRouter)
app.use("/api/goods/", goodsRouter)

app.listen(PORT , ()=> {
    console.log("Сервер успешно запущен на порту " + PORT + '...')
})
