import conn from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {check, validationResult} from "express-validator";
import config from 'config';
import AuthService from "../service/AuthService.js";


const generateAccesToken = (id, role) => {
    const payload = {
        id,
        role
    }
    return jwt.sign(payload, config.get('secretKey'), {expiresIn: '9h'})
}

export default class AuthController{

    static async getAllUsers(req, res) {
        try{
            const sql = `SELECT name, balance, id FROM userList`
            const result = (await conn.query(sql))[0]
            res.send(result)
        }catch(e){
            res.send(e)
        }
    }

    static async getTransactions(req, res) {
        try{
        const { firstDate, secondDate, id} = req.query
        const date0 = new Date((new Date(firstDate)).getTime() + 6*60*60*1000)
        const date = new Date((new Date(secondDate)).getTime() + 30*60*60*1000)
        const sql =  "SELECT * FROM transactions "  + `WHERE date BETWEEN '${date0.toISOString().substring(0,10)}' AND '${date.toISOString().substring(0,10)}'` + (id === 'All'? '' : ' AND user =' + id)
            const result = (await conn.query(sql))[0]
            res.send(result)
        }catch(e){
            res.send(e)
        }
    }

    static async payOff(req, res){
        const body = {type: 'Расчет' , ...req.body}
        try{
            const result = await AuthService.newTransaction(body)
            res.send(result)
        }catch(e){
            console.log(e)
            res.send(e)
        }
    }
    
    static async getUsers(req, res){
            const respond = []
            const sql = `SELECT * FROM userList WHERE name LIKE '%${req.query.searchValue}%'`
            try{
                const users = (await conn.query(sql))[0]
                users.map((user) => respond.push({value: user.id, label: user.name}))
                res.send(respond)
            }catch(e){
                console.log(e)
                res.send(e)
            }
        }

        static async getBalance(req, res) {
            try{
                const sql = `SELECT balance FROM userList WHERE id = ${req.params.id}`
                const response = (await conn.query(sql))[0][0]
                res.send(response)
            } catch(e) {
                res.send(e)
            }
        }

        static async registration(req, res) {
            try{
            const errors = validationResult(req)
            const {email, name, role, password} = req.body
            const sql = `SELECT * FROM userList WHERE email = '${email}'`
            const sql2 = `INSERT INTO userList SET ?`
            const candidate = (await conn.query(sql))[0][0]

            if(!errors.isEmpty){
                return res.status(400).json({message: 'Uncorrect request.' , errors})
            }
            else if(candidate){
                return res.status(400).json({message: 'User with such Email already exists.'})
            } else {
                const hashPassword = await bcrypt.hash(password, 5)
                await conn.query(sql2, {email, name, role , password: hashPassword})
                return res.json({message: 'User created succesfully.'}).status(200)
            }
        } catch(e) {
            console.log(e)
            res.send({message: "Server error: " + e})
        }
    }

    static async login(req, res){
        try{
            const {email, password} = req.body
            const sql = `SELECT * FROM userList WHERE email = '${email}'`
            const user = (await conn.query(sql))[0][0]
            if (!user) {
                return res.status(400).json({message: "Пользователь с таким E-mail не найден."})
            }
            const isPassValid = bcrypt.compareSync(password, user.password)
            if (!isPassValid){
                return res.status(400).json({message: "Пароль введен неверно."})
            }
            const token = generateAccesToken(user.id, user.role)
            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    balance: user.balance
                }
            })

        } catch(e) {
            console.log(e)
            res.send({message: "Ошибка сервера: " + e})
        }
    }
}