import { Router } from "express";
import conn from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {check, validationResult} from "express-validator";
import config from 'config';
import AuthController from "../controllers/AuthController.js";
import { authRole } from "../middleware/routerSecurity.js";

const router = new Router()

router.post('/registration', 
    [
        check('email', "Uncorrect email").isEmail(),
        check('password', "Password must be longer than 3 and shorter than 12").isLength({min: 3, max: 12}),
        check('name', "Name must be longer than 1 and shorter than 20").isLength({min: 1, max: 20}),
        check('role', "Role must be a number").isNumeric()
    ], AuthController.registration)
router.get('/users',authRole([0,1,2]),AuthController.getUsers)
router.post('/login', AuthController.login)
router.get('/balance/:id', authRole([0, 1,2]), AuthController.getBalance)
router.post('/payoff/', authRole([1,2]), AuthController.payOff)
router.get('/transactions/', authRole([0,1,2]), AuthController.getTransactions)
router.get('/users/all', authRole([0,1,2]), AuthController.getAllUsers)


export default router; 