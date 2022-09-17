import conn from '../db.js';

export default class OrderService {

    static async getGoodsNames(goods){
        const sql = `SELECT NAME FROM goods WHERE id = `
        const goodNames = []
        for(let i in goods) {
            const goodName = (await conn.query(sql+goods[i]))[0][0].NAME
            goodNames.push(goodName)
        }
        return goodNames.join('&&')
    }

    static async payOff(id, income){
        const sql = `SELECT balance FROM userlist WHERE id = ${id}`
        const sql2 = `UPDATE userlist SET balance = ? WHERE id = ${id}`
        try{
            const balance = (await conn.query(sql))[0][0].balance
            conn.query(sql2, balance + income)
            return 'ok'
        }catch(e){
            return(e)
        }
    }

    static async getUserName(id){
        const sql = `SELECT name FROM userlist WHERE id = ${id}`
        const data = (await conn.query(sql))[0][0]
        const name = data? data.name : ''
        return name
    }

    static async getGoodsString(goods, goodsCount){
        const sql = `SELECT NAME FROM goods WHERE id = `
        let goodsString = ''
        for(let i in goods){
            const good = (await conn.query(sql + goods[i]))[0][0].NAME
            if(goodsCount[i] > 0)
                {
                    goodsString += good + ' - ' + (goodsCount[i]) + 'шт;\n'
                }
            else if(goodsCount[i] < 0) 
                {
                    goodsString += 'Возврат: ' + good + ' - ' + (Math.abs(goodsCount[i])) + 'шт;\n'
                }
        }
        goodsString = goodsString.substring(0, goodsString.length - 2) + '.'
        return goodsString
    }

    static getSum(prices, goodsCount, deliveryPriceForCustomer, discount){
        let sum = 0
        const discountTemp = discount
        const deliveryPriceForCustomerTemp = deliveryPriceForCustomer
        for (let i in prices) {
            sum += (prices[i].SECOND_PRICE * goodsCount[i])
        }
        const result = sum + deliveryPriceForCustomerTemp - discountTemp
        return result
    }

    static getWholesaleSum(prices, goodsCount) {
        let sum = 0
        for (let i in prices) {
            sum += (prices[i].FIRST_PRICE * goodsCount[i])
        }
        return sum
    }

    static getPaymentSum(payment) {
        let sum = 0
        for (let i in payment) {
            const part = payment[i].sum
            const percent = payment[i].percent
            sum += ((part * percent) / 100)
        }
        return sum
    }

    static async getPricesOF(goods) {
        const sql = `SELECT FIRST_PRICE, SECOND_PRICE FROM goods WHERE id = `
        let prices = {}
        for (let i in goods) {
            const valuesFromDB = await conn.query(sql + goods[i])
            prices[i] = valuesFromDB[0][0]
        }
        return prices
    }

    static getIncome(sum, payment, wholesaleSum, deliveryPriceForStore) {
        const result = sum - payment - deliveryPriceForStore - wholesaleSum
        return result
    }

    static getSumOfPayment(payment) {
        let sum = 0
        for (let i in payment) {
            sum += (payment[i].sum)
        }
        const result = sum
        return result
    }

}