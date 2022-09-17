import e from "cors";
import conn from "../db.js";

export default class GoodController{

    static async deleteGood(req, res){
        const sql = `DELETE FROM goods WHERE ID = ${req.query.id} LIMIT 1`
        try{
            const data = (await conn.query(sql))
            res.send(data)
        }catch{
            res.status(400).json({message: 'server error' + e})
        }
    }

    static async editGood(req, res){
        const sql = `UPDATE goods SET ?, DATE = CURRENT_TIMESTAMP WHERE ID = ${req.query.id}`
        try{
            const data = (await conn.query(sql, req.body))
            res.send(data)
        }catch{
            res.status(400).json({message: 'server error' + e})
        }
    }

    static async newGood(req, res){
        const sql = `INSERT INTO goods SET ?`
        try{
            const data = (await conn.query(sql, req.body))
            res.send(data)
        }catch{
            res.status(400).json({message: 'server error' + e})
        }
    }

    static async getGoodInfo(req, res){
        const sql = `SELECT * FROM goods WHERE ID = ${req.query.id}`
        try{
            const data = (await conn.query(sql))[0][0]
            res.send(data)
        }catch(e){
            res.status(400).json({message: 'server error' + e})
        }
    }
    static async getGoodsPrices(req, res){
        const sql = `SELECT FIRST_PRICE, SECOND_PRICE FROM goods WHERE ID = ${req.query.id}`
        try{
            const prices = (await conn.query(sql))[0][0]
            res.send(prices)
        }catch(e){
            console.log(e)
            res.send(e)
        }
    }
    static async getGoodByName(req, res){
        const respond = []
        const sql = `SELECT * FROM goods WHERE NAME LIKE '%${req.query.searchValue}%'`
        try{
            const goods = (await conn.query(sql))[0]
            goods.map((good) => respond.push({value: good.ID, label: good.NAME}))
            res.send(respond)
        }catch(e){
            console.log(e)
            res.send(e)
        }
    }
    static async getAllGoods(req, res){
        const sql = "SELECT * FROM goods"
        try{
        const goods = (await conn.query(sql))[0]
        res.send(goods)
        }catch(e){
            console.log(e)
            res.status(500).json({message:'server error: ' + e})
        }
    }
    static async getNameOfGood(req, res){
        const sql = "SELECT NAME FROM goods WHERE ID =" + req.params.id
        try{
            const goodName = (await conn.query(sql))[0][0].NAME
            res.send(goodName)
        }catch(e){
            console.log(e)
        }
    }
    
}