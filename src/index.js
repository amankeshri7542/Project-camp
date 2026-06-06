import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import app from "./app.js";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 8000;

console.log("--- startup diagnostics ---");
console.log("NODE_ENV:", process.env.NODE_ENV || "(not set)");
console.log("PORT:", PORT);
console.log("MONGO_URI set:", !!process.env.MONGO_URI);
console.log("MONGODB_URI set:", !!process.env.MONGODB_URI);
console.log("ACCESS_TOKEN_SECRET set:", !!process.env.ACCESS_TOKEN_SECRET);
console.log("---------------------------");

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to the database:", err.message);
        process.exit(1);
    });