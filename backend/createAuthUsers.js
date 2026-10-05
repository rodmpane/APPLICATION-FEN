import bcrypt from "bcrypt";
import pool from "./config/database.js";

const utilisateurs = [
    {
        nom: "Administrateur FEN",
        username: "admin_fen",
        email: "admin@fen.cd",
        password: "FEN@Admin2026!",
        role: "ADMIN"
    },
    {
        nom: "Président de la Fondation",
        username: "president_fen",
        email: "president@fen.cd",
        password: "FEN@President2026!",
        role: "PRESIDENT"
    },
    {
        nom: "Secrétaire Général",
        username: "secretaire_general_fen",
        email: "secretaire@fen.cd",
        password: "FEN@Secretaire2026!",
        role: "SECRETAIRE_GENERAL"
    }
];

try {
    console.log("Création de la table des comptes...");

    await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_users (
            id BIGSERIAL PRIMARY KEY,
            nom VARCHAR(150) NOT NULL,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(150) UNIQUE,
            password_hash TEXT NOT NULL,
            role VARCHAR(30) NOT NULL,
            actif BOOLEAN NOT NULL DEFAULT TRUE,
            date_creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    for (const utilisateur of utilisateurs) {
        const passwordHash = await bcrypt.hash(
            utilisateur.password,
            12
        );

        await pool.query(
            `
            INSERT INTO auth_users
                (
                    nom,
                    username,
                    email,
                    password_hash,
                    role,
                    actif
                )
            VALUES
                ($1, $2, $3, $4, $5, TRUE)
            ON CONFLICT (username)
            DO UPDATE SET
                nom = EXCLUDED.nom,
                email = EXCLUDED.email,
                password_hash = EXCLUDED.password_hash,
                role = EXCLUDED.role,
                actif = TRUE
            `,
            [
                utilisateur.nom,
                utilisateur.username,
                utilisateur.email,
                passwordHash,
                utilisateur.role
            ]
        );

        console.log(`Compte créé : ${utilisateur.username}`);
    }

    console.log("");
    console.log("========================================");
    console.log("COMPTES FEN CREES");
    console.log("========================================");
    console.log("");
    console.log("ADMINISTRATEUR");
    console.log("Utilisateur : admin_fen");
    console.log("Mot de passe : FEN@Admin2026!");
    console.log("");
    console.log("PRESIDENT");
    console.log("Utilisateur : president_fen");
    console.log("Mot de passe : FEN@President2026!");
    console.log("");
    console.log("SECRETAIRE GENERAL");
    console.log("Utilisateur : secretaire_general_fen");
    console.log("Mot de passe : FEN@Secretaire2026!");
    console.log("");
    console.log("========================================");

} catch (error) {
    console.error("Erreur création comptes :", error);
} finally {
    await pool.end();
}