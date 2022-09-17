import { Router } from "express";
import conn from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {check, validationResult} from "express-validator";
import config from 'config';
import OrderService from "../service/OrderService.js";
import {authRole} from '../middleware/routerSecurity.js';
import OrderController from "../controllers/OrderController.js";

const router = new Router()

router.post('/create',authRole([0,1,2]), OrderController.createOrder)
router.get('/',authRole([0,1,2]), OrderController.getAllOrders)
router.get('/details/:id',authRole([0,1,2]), OrderController.getOneOrder)
router.post('/finished/',authRole([0,1,2]), OrderController.getFinishedOrders)
router.patch('/edit/:id',authRole([1,2]), OrderController.editOrder)
router.patch('/accept/:id',authRole([1,2]), OrderController.acceptOrder)
router.patch('/finish/:id',authRole([1,2]), OrderController.finishOrder)
router.get('/search',authRole([1,2]), OrderController.searchOrder)

export default router