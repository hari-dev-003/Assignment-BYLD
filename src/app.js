import express from "express"
import {logger} from "./middleware/logger.js";
import router from './routes/v1.routes.js';

const app = express()
app.use(express.json())
app.use(logger)

app.use("/v1",router);

app.get("/v1/test", (req, res) => res.send("V1 is working!"));

app.get("/",(req,res)=>{
    res.json("Welcome to backend")
})

export default app;