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
        const {
            email,
            username,
            password
        } = req.body;

        const identifiant = (
            email ||
            username ||
            ""
        )
            .trim()
            .toLowerCase();

        if (!identifiant || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Adresse e-mail et mot de passe obligatoires."
            });
        }

        const result = await pool.query(
            `
            SELECT
                id,
                nom,
                email,
                mot_de_passe,
                role,
                actif
            FROM users
            WHERE LOWER(email) = $1
            LIMIT 1
            `,
            [identifiant]
        );

        console.log(
            "LOGIN - compte trouvé :",
            result.rows.length > 0
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message:
                    "Adresse e-mail ou mot de passe incorrect."
            });
        }

        const utilisateur = result.rows[0];

        console.log(
            "LOGIN - compte actif :",
            utilisateur.actif
        );

        console.log(
            "LOGIN - hash présent :",
            Boolean(utilisateur.mot_de_passe)
        );

        if (!utilisateur.actif) {
            return res.status(403).json({
                success: false,
                message:
                    "Ce compte est désactivé."
            });
        }

        if (!utilisateur.mot_de_passe) {
            console.error(
                "LOGIN - mot de passe absent de la base."
            );

            return res.status(500).json({
                success: false,
                message:
                    "Le compte administrateur est mal configuré."
            });
        }

        const motDePasseCorrect =
            await bcrypt.compare(
                password,
                utilisateur.mot_de_passe
            );

        console.log(
            "LOGIN - mot de passe correct :",
            motDePasseCorrect
        );

        if (!motDePasseCorrect) {
            return res.status(401).json({
                success: false,
                message:
                    "Adresse e-mail ou mot de passe incorrect."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error(
                "LOGIN - JWT_SECRET absent."
            );

            return res.status(500).json({
                success: false,
                message:
                    "Configuration de sécurité du serveur absente."
            });
        }

        const role = String(
            utilisateur.role || "admin"
        )
            .trim()
            .toUpperCase();

        const token = jwt.sign(
            {
                id: utilisateur.id,
                email: utilisateur.email,
                role,
                nom: utilisateur.nom
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        console.log(
            "LOGIN - token JWT créé avec succès."
        );

        return res.json({
            success: true,
            message: "Connexion réussie.",
            token,
            utilisateur: {
                id: utilisateur.id,
                nom: utilisateur.nom,
                email: utilisateur.email,
                role
            }
        });

    } catch (error) {
        console.error(
            "Erreur login :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la connexion."
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
|--------------------------------------------------------------------------
*/

export const meController = async (req, res) => {
    try {
        if (!req.utilisateur) {
            return res.status(401).json({
                success: false,
                message:
                    "Utilisateur non authentifié."
            });
        }

        const result = await pool.query(
            `
            SELECT
                id,
                nom,
                email,
                role,
                actif
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [req.utilisateur.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Utilisateur introuvable."
            });
        }

        const utilisateur = result.rows[0];

        if (!utilisateur.actif) {
            return res.status(403).json({
                success: false,
                message:
                    "Ce compte est désactivé."
            });
        }

        const role = String(
            utilisateur.role || ""
        )
            .trim()
            .toUpperCase();

        return res.json({
            success: true,
            utilisateur: {
                id: utilisateur.id,
                nom: utilisateur.nom,
                email: utilisateur.email,
                role
            }
        });

    } catch (error) {
        console.error(
            "Erreur récupération utilisateur connecté :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération du profil."
        });
    }
};