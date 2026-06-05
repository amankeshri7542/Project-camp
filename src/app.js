import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));


app.use(cookieParser());

app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(",") || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


import healthCheckRoutes from "./controllers/healthcheck.routes.js";
app.use("/api/v1/healthcheck", healthCheckRoutes);

import authRouter from "./routes/auth.routes.js";
app.use("/api/v1/auth", authRouter);

import projectRouter from "./routes/project.routes.js";
app.use("/api/v1/projects", projectRouter);


app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";

    res.status(statusCode).json({
        statusCode,
        message,
        errors: err.errors || [],
        success: false,
    });
});

export default app;


