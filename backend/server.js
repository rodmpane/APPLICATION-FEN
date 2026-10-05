import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import pool from "./config/database.js";

import authRoutes from "./routes/auth.js";
import membersRoutes from "./routes/members.js";
import zonesRoutes from "./routes/zones.js";
import coordinationsRoutes from "./routes/coordinations.js";
import provincesRoutes from "./routes/provinces.js";
import foundationRoutes from "./routes/foundation.js";
import cardsRoutes from "./routes/cards.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://application-fen-1.onrender.com"
        ],
        credentials: true
    })
);

app.use(express.json({ limit: "10mb" }));

// ========================================
// ROUTE PRINCIPALE
// ========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "API Fondation Ézéchiel NTAL opérationnelle"
    });
});

// ========================================
// HEALTH CHECK
// ========================================

app.get("/health", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT NOW() AS date_serveur, current_database() AS base"
        );

        res.json({
            status: "ok",
            database: result.rows[0]
        });

    } catch (error) {
        console.error("Erreur PostgreSQL :", error);

        res.status(500).json({
            status: "error",
            message: "Connexion PostgreSQL impossible"
        });
    }
});

// ========================================
// AUTHENTIFICATION
// ========================================

app.use("/api/auth", authRoutes);

// ========================================
// API MEMBRES
// ========================================

app.use("/api/members", membersRoutes);

// ========================================
// API ZONES
// ========================================

app.use("/api/zones", zonesRoutes);

// ========================================
// API COORDINATIONS
// ========================================

app.use("/api/coordinations", coordinationsRoutes);

// ========================================
// API PROVINCES
// ========================================

app.use("/api/provinces", provincesRoutes);

// ========================================
// API FONDATION
// ========================================

app.use("/api/foundation", foundationRoutes);

// ========================================
// API CARTES DE MEMBRES + QR CODE
// ========================================

app.use("/api/cards", cardsRoutes);

// ========================================
// ROUTE 404
// ========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route introuvable.",
        route: req.originalUrl
    });
});

// ========================================
// ERREUR GLOBALE
// ========================================

app.use((error, req, res, next) => {
    console.error("Erreur serveur :", error);

    res.status(500).json({
        success: false,
        message: "Erreur interne du serveur."
    });
});

// ========================================
// DEMARRAGE
// ========================================

app.listen(PORT, () => {
    console.log("========================================");
    console.log("API FONDATION DEMARREE");
    console.log(`Port : ${PORT}`);
    console.log(`Base : ${process.env.DB_NAME}`);
    console.log("========================================");

    console.log("Authentification :");
    console.log("POST /api/auth/login");

    console.log("========================================");

    console.log("Routes Membres :");
    console.log("GET    /api/members");
    console.log("POST   /api/members");
    console.log("GET    /api/members/:id");
    console.log("PUT    /api/members/:id");
    console.log("DELETE /api/members/:id");

    console.log("========================================");

    console.log("Routes Fondation :");
    console.log("GET /api/foundation/leaders");
    console.log("GET /api/foundation/president");
    console.log("GET /api/foundation/secretary");
    console.log("GET /api/foundation/coordinators");
    console.log("GET /api/foundation/structure");

    console.log("========================================");

    console.log("Routes Cartes de membres :");
    console.log("POST /api/cards/member/:memberId/generate");
    console.log("GET  /api/cards/member/:memberId");
    console.log("GET  /api/cards/member/:memberId/pdf");
    console.log("GET  /api/cards/verify/:qrToken");

    console.log("========================================");
});