import express from "express"
import {logger} from "./middleware/logger.js";
import router from './routes/sample.route.js';

const app = express()
app.use(express.json())
app.use(logger)

app.use("/api/app",router);

app.get("/",(req,res)=>{
    res.json("Welcome to backend")
})

export default app;