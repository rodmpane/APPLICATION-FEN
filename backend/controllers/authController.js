import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";


/*
|--------------------------------------------------------------------------
| CONNEXION
|--------------------------------------------------------------------------
*/

export const loginController = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Nom d'utilisateur et mot de passe obligatoires."
            });
        }

        const result = await pool.query(
            `
            SELECT
                id,
                nom,
                username,
                password_hash,
                role,
                actif
            FROM auth_users
            WHERE username = $1
            LIMIT 1
            `,
            [username.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Nom d'utilisateur ou mot de passe incorrect."
            });
        }

        const utilisateur = result.rows[0];

        if (!utilisateur.actif) {
            return res.status(403).json({
                success: false,
                message: "Ce compte est désactivé."
            });
        }

        const motDePasseCorrect = await bcrypt.compare(
            password,
            utilisateur.password_hash
        );

        if (!motDePasseCorrect) {
            return res.status(401).json({
                success: false,
                message: "Nom d'utilisateur ou mot de passe incorrect."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error(
                "JWT_SECRET absent du fichier .env"
            );

            return res.status(500).json({
                success: false,
                message: "Configuration de sécurité du serveur absente."
            });
        }

        const token = jwt.sign(
            {
                id: utilisateur.id,
                username: utilisateur.username,
                role: utilisateur.role,
                nom: utilisateur.nom
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        return res.json({
            success: true,
            message: "Connexion réussie.",
            token,
            utilisateur: {
                id: utilisateur.id,
                nom: utilisateur.nom,
                username: utilisateur.username,
                role: utilisateur.role
            }
        });

    } catch (error) {
        console.error(
            "Erreur login :",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la connexion."
        });
    }
};


/*
|--------------------------------------------------------------------------
| UTILISATEUR CONNECTÉ
|--------------------------------------------------------------------------
|
| GET /api/auth/me
|
| Le middleware authentifier vérifie déjà le JWT.
|
|--------------------------------------------------------------------------
*/

export const meController = async (req, res) => {
    try {
        if (!req.utilisateur) {
            return res.status(401).json({
                success: false,
                message: "Utilisateur non authentifié."
            });
        }

        const result = await pool.query(
            `
            SELECT
                id,
                nom,
                username,
                role,
                actif
            FROM auth_users
            WHERE id = $1
            LIMIT 1
            `,
            [req.utilisateur.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Utilisateur introuvable."
            });
        }

        const utilisateur = result.rows[0];

        if (!utilisateur.actif) {
            return res.status(403).json({
                success: false,
                message: "Ce compte est désactivé."
            });
        }

        return res.json({
            success: true,
            utilisateur: {
                id: utilisateur.id,
                nom: utilisateur.nom,
                username: utilisateur.username,
                role: utilisateur.role
            }
        });

    } catch (error) {
        console.error(
            "Erreur récupération utilisateur connecté :",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération du profil."
        });
    }
};