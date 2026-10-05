import express from "express";
import pool from "../config/database.js";
import {
    authentifier,
    autoriserRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| STRUCTURE DE LA FONDATION
|--------------------------------------------------------------------------
| Accessible aux 3 profils :
| ADMIN
| PRESIDENT
| SECRETAIRE_GENERAL
|--------------------------------------------------------------------------
*/

router.get(
    "/structure",
    authentifier,
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    async (req, res) => {

        try {

            const result = await pool.query(`
                SELECT
                    id,
                    nom,
                    type,
                    parent_id
                FROM foundation_structure
                ORDER BY id
            `);

            return res.json({
                success: true,
                structure: result.rows
            });

        } catch (error) {

            console.error(
                "Erreur récupération structure :",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Erreur lors de la récupération de la structure."
            });
        }
    }
);

export default router;