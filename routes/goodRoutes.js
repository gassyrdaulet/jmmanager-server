import { Router } from "express";
import GoodController from "../controllers/GoodController.js";

const router = new Router()

router.get('/', GoodController.getAllGoods)
router.get('/name/:id', GoodController.getNameOfGood)
router.get('/search',GoodController.getGoodByName)
router.get('/prices',GoodController.getGoodsPrices)
router.get('/details',GoodController.getGoodInfo)
router.patch('/edit',GoodController.editGood)
router.post('/new',GoodController.newGood)
router.delete('/delete',GoodController.deleteGood)

export default router