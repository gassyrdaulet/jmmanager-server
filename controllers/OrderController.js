import conn from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {check, validationResult} from "express-validator";
import config from 'config';
import OrderService from "../service/OrderService.js";
import {auth} from '../middleware/routerSecurity.js';
import AuthService from "../service/AuthService.js";



export default class OrderController {
    static async createOrder(req, res){
        const status = parseInt(req.headers.orderstatus, 10)
        const body = req.body
        const goods = (req.body.goods ? req.body.goods : undefined)
        const jsonGoods = req.body.goods ? JSON.stringify(req.body.goods) : undefined
        const address = (req.body.address)
        const jsonAddress = JSON.stringify(req.body.address)
        const goodsCount = req.body.goodsCount
        const jsonGoodsCount = JSON.stringify(req.body.goodsCount)
        const deliveryPriceForCustomer = req.body.deliveryPriceForCustomer
        const telephoneNumber = req.body.telephoneNumber
        const user = req.body.user
        const discount = req.body.discount? req.body.discount : 0
        const comment = req.body.comment
        const payment = req.body.payment ? req.body.payment : undefined
        const jsonPayment = req.body.payment ? JSON.stringify(req.body.payment) : undefined
        const prices = await OrderService.getPricesOF(goods)
        const sum = OrderService.getSum(prices, goodsCount, deliveryPriceForCustomer, discount)
        const jsonPrices = goods ? JSON.stringify(await OrderService.getPricesOF(goods)) : undefined
        const sumOfPayment = OrderService.getSumOfPayment(payment)
        const paymentSum = OrderService.getPaymentSum(payment)
        const wholeSaleSum = OrderService.getWholesaleSum(prices, goodsCount)
        
        console.log(sumOfPayment, sum)

        if (status === 0 && sumOfPayment === sum) {
            body.status = 0
            body.goods = jsonGoods
            body.sum = sum
            body.address = jsonAddress
            body.goodsCount = jsonGoodsCount
            body.prices = jsonPrices
            body.payment = jsonPayment
            body.paymentSum = paymentSum
            body.wholesaleSum = wholeSaleSum
            body.addressString = (Object.values(address).toString())
            try {
                body.goodsString = await OrderService.getGoodsString(goods, goodsCount)
                body.userName = await OrderService.getUserName(parseInt(user))
                delete body.id
                body.goodsNamesString = await OrderService.getGoodsNames(goods)
                const sql = `INSERT INTO orders SET ?`
            
                await conn.query(sql, body)
                res.sendStatus(200)
            } catch (e) {
                res.send({message: 'server error: ' + e})
            }
        } else if (status === 5) {
            const sql = `SELECT * FROM finished_orders WHERE id = ${body.id}`
            const sql2 = `INSERT INTO orders SET ?`
            const sql3 = `UPDATE finished_orders SET children = 1 WHERE id = ${body.id}`
            try {
                const result = (await conn.query(sql))[0][0]
                if(!result || result.children === 1){
                    res.status(400).json({message: 'У этого заказа уже есть один дочерний объект.'})
                } else if (result != undefined) {
                    result.goodsString = await OrderService.getGoodsString(result.goods, goodsCount)
                    result.goodsNamesString = await OrderService.getGoodsNames(result.goods)
                    result.goods = (JSON.stringify(result.goods))
                    result.goodsCount = jsonGoodsCount
                    result.address = jsonAddress
                    result.addressString = (Object.values(address).toString())
                    result.telephoneNumber = telephoneNumber
                    result.pickup = req.body.pickup
                    result.deliveryPriceForCustomer = deliveryPriceForCustomer
                    result.status = 0
                    result.deliveryPriceForStore = 0
                    const pricesTemp = result.prices
                    result.prices = JSON.stringify(pricesTemp)
                    result.discount = discount
                    delete result.payment
                    delete result.income
                    delete result.creationDate
                    delete result.finishedDate
                    delete result.paymentSum
                    delete result.deliver
                    result.comment = comment
                    result.prototype = result.id
                    delete result.id
                    result.retOrEx = 1
                    result.sum = OrderService.getSum(pricesTemp, goodsCount, deliveryPriceForCustomer, discount)
                    result.wholesaleSum = -(OrderService.getWholesaleSum(pricesTemp, goodsCount))
                    delete result.children
                    delete result.incomeForUser
    
                    await conn.query(sql2, result)
                    await conn.query(sql3)
                    res.sendStatus(200)
                }
            } catch (e) {
                res.status(400).json({message: 'Ошибка: ' + e})
            }
        } else {
            res.status(400).json({message: 'Неизвестная ошибка'})
        }
    }
    static async getAllOrders(req, res){
        await OrderService.payOff(7,500)           
        const status = parseInt(req.query.status)
        const pickup = parseInt(req.query.pickup)
        const sql = `SELECT * FROM orders WHERE status IN (${status})`
        let sql2 = ''
        if (status === 1) {
            sql2 = ' AND pickup = ' + pickup
        }
        const sql3 = sql + sql2
        try {
            const result = (await conn.query(sql3))[0]
            res.send(result)
        } catch (e) {
            res.send({message: 'server error: ' + e})
        }
    }
    static async getOneOrder(req, res){
        const id = req.params.id
        const sql = `SELECT * FROM orders WHERE id = ${parseInt(id)}`
        const sql2 = `SELECT * FROM finished_orders WHERE id = ${parseInt(id)}`
    
        try {
            const result = await conn.query(sql)
            if (!result[0][0]) {
                const result2 = await conn.query(sql2)
                if (!result2[0][0]) {
                    res.send({message: 'Заказ не найден'})
                } else {
                    res.send(result2[0][0])
                }
            } else {
                res.send(result[0][0])
            }
        } catch (e) {
            res.send(e)
        }
    }

    static async searchOrder(req, res){
        const {telephoneNumber, id, status} = req.query
        const sql = `SELECT * FROM orders WHERE id LIKE '%${id + ''}%'` + (telephoneNumber===''?'':` AND telephoneNumber LIKE '%${telephoneNumber}%'`) + ` AND status = ${status}`
        const sql2 = `SELECT * FROM finished_orders WHERE id LIKE '%${id + ''}%'` + (telephoneNumber===''?'':` AND telephoneNumber LIKE '%${telephoneNumber}%'`) + ` AND status = ${status}`
        try {
            const result = await conn.query(sql)
            if (!result[0][0]) {
                const result2 = await conn.query(sql2)
                if (!result2[0]) {
                    res.send([])
                } else {
                    res.send(result2[0])
                }
            } else {
                res.send(result[0])
            }
        } catch (e) {
            res.send(e)
        }
    }

    static async getFinishedOrders(req, res){
        const { firstDate, secondDate} = req.body
        const date0 = new Date((new Date(firstDate)).getTime() + 6*60*60*1000)
        const date = new Date((new Date(secondDate)).getTime() + 30*60*60*1000)
        const sql = `SELECT * FROM finished_orders WHERE finishedDate BETWEEN '${date0.toISOString().substring(0,10)}' AND '${date.toISOString().substring(0,10)}'`
        try {
            const result = await conn.query(sql)
            res.send(result[0])
        } catch (e) {
            console.log(e)
            res.send(e)
        }
    }
    static async editOrder(req, res){
        console.log(req.body)
        const body = req.body
        const sql = `SELECT * FROM orders WHERE id = ${parseInt(req.params.id)}`
        const sql3 = `UPDATE orders SET ? WHERE id = ${parseInt(req.params.id)}`
        try {
            const result = (await conn.query(sql))[0][0]
            if((result.retOrEx === 0 && OrderService.getSum(await OrderService.getPricesOF(body.goods? body.goods : result.goods), body.goodsCount , body.deliveryPriceForCustomer, body.discount ? body.discount : result.discount) != OrderService.getSumOfPayment(body.payment? body.payment : result.payment))){
                res.status(400).json({message: "Суммы не соответствуют"})
            } else if ((result.status === 0 && (body.deliver || body.deliveryPriceForStore) ) || (result.retOrEx!==1&&(body.goods === undefined || body.goodsCount === undefined)) || body.id != undefined || body.pickup != undefined || !result || ( ((result.retOrEx === 1) && (body.goods || body.prices || body.payment)))) {
                res.status(400).json({message : 'Ошибка: Order not found or Incorrect JSON body of query.'})
            } else {
                const goods = body.goods? body.goods : undefined
                const goodsCount = body.goodsCount ? body.goodsCount : undefined
                const address = body.address ? body.address : undefined
                const telephoneNumber = body.telephoneNumber ? body.telephoneNumber : undefined
                const deliveryPriceForCustomer = body.deliveryPriceForCustomer ? body.deliveryPriceForCustomer : undefined
                const deliveryPriceForStore = body.deliveryPriceForStore ? body.deliveryPriceForStore : undefined
                const discount = body.discount ? body.discount : undefined
                const deliver = body.deliver ? body.deliver : undefined
                const payment = body.payment ? body.payment : undefined
                const comment = body.comment ? body.comment : undefined
    
                result.goodsCount = goodsCount? goodsCount : result.goodsCount
                result.deliveryPriceForCustomer = deliveryPriceForCustomer ? deliveryPriceForCustomer : (result.deliveryPriceForCustomer? result.deliveryPriceForCustomer : 0)
                result.discount = discount ? discount : (result.discount ? result.discount : 0)
                   
                if((goods || goodsCount || deliveryPriceForCustomer || discount) && result.retOrEx === 0){
                    result.goods = goods? goods : result.goods
                    result.goodsNamesString = await OrderService.getGoodsNames(result.goods)
                    result.prices = await OrderService.getPricesOF(result.goods)
                    result.sum = OrderService.getSum(result.prices, result.goodsCount, result.deliveryPriceForCustomer, result.discount)
                    result.wholesaleSum = OrderService.getWholesaleSum(result.prices, result.goodsCount )
                
                } else if ((goodsCount || deliveryPriceForCustomer || discount) && result.retOrEx === 1 && !goods){
                    result.sum = OrderService.getSum(result.prices, result.goodsCount, result.deliveryPriceForCustomer, result.discount)
                    result.wholesaleSum = -(OrderService.getWholesaleSum(result.prices, result.goodsCount))
                }
                result.goodsString = await OrderService.getGoodsString(goods? goods : result.goods, goodsCount? goodsCount : result.goodsCount)
                result.deliverName = await OrderService.getUserName(deliver? deliver : result.deliver)
                result.goods = JSON.stringify(result.goods)
                result.prices = JSON.stringify(result.prices)
                result.goodsCount = JSON.stringify(result.goodsCount)
    
                result.addressString = (Object.values(address? address : result.address).toString())
                result.address = address ? JSON.stringify(address) : JSON.stringify(result.address)
                result.telephoneNumber = telephoneNumber ? telephoneNumber : result.telephoneNumber
                result.deliveryPriceForStore = deliveryPriceForStore ? deliveryPriceForStore : result.deliveryPriceForStore
                result.paymentSum = OrderService.getPaymentSum(result.payment)
                if(!(result.status === 0)) result.deliver = deliver ? deliver : result.deliver
                result.payment = payment ? JSON.stringify(payment) : JSON.stringify(result.payment)
                result.comment = comment ? comment : result.comment

                delete result.id
                delete result.status
                delete result.income
                delete result.creationDate
                delete result.prototype
                delete result.cancelOrWhileDel
                delete result.pickup
                delete result.user
                delete result.userName
    
                await conn.query(sql3, result)
                res.sendStatus(200)
            }
        } catch (e) {
            res.send(e)
        }
    }
    static async acceptOrder (req, res) {
        const sql = `SELECT * FROM orders where id = ${parseInt(req.params.id)} AND status = 0`
        const sql2 = `UPDATE orders SET status = 1, ? where id = ${req.params.id}`
        const sql4 = `UPDATE orders SET status = 1 where id = ${req.params.id}`
    
        try {
            const result = (await conn.query(sql))[0][0]
            if (result) {

                if (result.pickup === 0) {

                    if(req.body.deliver != undefined && req.body.deliveryPriceForStore != undefined){
                        req.body.deliverName = await OrderService.getUserName(req.body.deliver)
                        await conn.query(sql2, req.body)
                        res.sendStatus(200)
                    } else {
                        res.send({message: "server error 2"})
                    }
                } else if (result.pickup === 1) {
                    await conn.query(sql4)
                    res.sendStatus(200)
                }
            } else {
                res.send({message: 'Заказ не найден'})
            }
        } catch (e) {
            res.send(e)
        }
    }
    static async finishOrder (req, res){
        const sql = `SELECT * FROM orders WHERE id = ${req.params.id}`
        const sql2 = `DELETE FROM orders WHERE id = ${req.params.id}`
        const sql3 = `INSERT INTO finished_orders SET ?`
        const cancelOrder = parseInt(req.query.cancel ? req.query.cancel : 0)
        const whileDelivering = parseInt(req.query.whileDelivering ? req.query.whileDelivering : 0)
        const didPay = parseInt(req.query.didPay ? req.query.didPay : 0)
    
        try {
            const body = (await conn.query(sql))[0][0]
            const prices = body.prices
            const goodsCount = body.goodsCount
            body.goods = JSON.stringify(body.goods)
            body.goodsCount = JSON.stringify(body.goodsCount)
            body.address = JSON.stringify(body.address)
            body.payment = JSON.stringify(body.payment)
            body.prices = JSON.stringify(body.prices)
            body.status = 2

            if (body.retOrEx === 1) {
                body.income = -(-(OrderService.getSum(prices, goodsCount, -body.deliveryPriceForCustomer, -body.discount)) - body.deliveryPriceForStore - body.wholesaleSum)
                body.incomeForUser = Math.floor(body.income / 2)
            } else if (cancelOrder === 1) {
                body.income = 0
                body.incomeForUser = (whileDelivering === 1) ? -body.deliveryPriceForStore + (didPay ? body.deliveryPriceForCustomer : 0) : 0
                body.cancelOrWhileDel = 1
            } else {
                body.income = body.sum - body.wholesaleSum - body.deliveryPriceForStore - body.paymentSum
                body.incomeForUser = Math.floor(body.income / 2)
                AuthService.newTransaction({type: 'Продажа', sum: body.incomeForUser, user: body.user})
            }
            await conn.query(sql3, body)
            await conn.query(sql2)

            res.sendStatus(200)
        } catch (e) {
            res.send(e)
        }
    }
}