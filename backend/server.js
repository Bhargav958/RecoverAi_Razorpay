import dotenv from "dotenv"
import app from "./src/app.js"

dotenv.config();

const port = process.env.PORT || 5000;

app.listen(port, ()=>{
    console.log(`RecoverAI backend is running on port ${port}`)
});