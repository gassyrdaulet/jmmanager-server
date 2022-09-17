import conn from '../db.js';

export default class AuthService {
    static async getBalance(id) {
        try{
            const sql = `SELECT balance FROM userList WHERE id = ${id}`
            const response = (await conn.query(sql))[0][0]
            return response
        } catch(e) {
            return e
        }
    }

    static async newTransaction(body){
        const sql = `INSERT INTO transactions SET ?`
        const balance = (await AuthService.getBalance(body.user)).balance + body.sum
        const sql2 = `UPDATE userList SET balance = ${balance} WHERE id = ${body.user}`
        await conn.query(sql2)
        body.balance = balance
        const transaction = (await conn.query(sql, body))
        return transaction.insertId
    }
}