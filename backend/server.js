import dotenv from "dotenv"
import app from "./src/app.js"
import connectDB from "./src/config/db.js";

dotenv.config();

const port = process.env.PORT || 5000;

const startServer = async()=>{
    await connectDB();

    app.listen(port, ()=>{
        console.log(`RecoverAI backend is running on port ${port}`)
    });
}

startServer();