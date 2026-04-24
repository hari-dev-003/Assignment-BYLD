import { Router } from "express";
import S_Controller  from "../controllers/sample.controller.js";

const router = Router();

router.get('/',S_Controller)

export default router;