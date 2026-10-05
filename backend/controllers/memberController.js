import pool from "../config/database.js";

/* ============================================================
   OUTILS
============================================================ */

const valeurOuNull = (valeur) => {
    if (
        valeur === undefined ||
        valeur === null ||
        String(valeur).trim() === ""
    ) {
        return null;
    }

    return valeur;
};

const entierOuNull = (valeur) => {
    if (
        valeur === undefined ||
        valeur === null ||
        valeur === ""
    ) {
        return null;
    }

    const nombre = Number(valeur);

    return Number.isNaN(nombre) ? null : nombre;
};

/* ============================================================
   GET TOUS LES MEMBRES
============================================================ */

export const getMembers = async (req, res) => {
    try {
        const resultat = await pool.query(`
            SELECT
                m.id,
                m.matricule,
                m.nom,
                m.postnom,
                m.prenom,
                m.sexe,
                m.date_naissance,
                m.telephone,
                m.telephone_secondaire,
                m.email,
                m.adresse,
                m.commune,
                m.ville,
                m.profession,
                m.photo_url,
                m.zone_id,
                m.coordination_id,
                m.status_id,
                m.fonction_id,
                m.date_adhesion,
                m.date_expiration,
                m.observations,
                m.actif,
                m.date_creation,
                m.date_modification,

                z.nom AS zone_nom,
                z.province_id,

                p.nom AS province_nom,

                c.nom AS coordination_nom

            FROM members m

            LEFT JOIN zones z
                ON z.id = m.zone_id

            LEFT JOIN provinces p
                ON p.id = z.province_id

            LEFT JOIN coordinations c
                ON c.id = m.coordination_id

            ORDER BY m.id DESC
        `);

        res.json(resultat.rows);
    } catch (error) {
        console.error(
            "Erreur récupération membres :",
            error
        );

        res.status(500).json({
            message:
                "Erreur lors de la récupération des membres.",
        });
    }
};

/* ============================================================
   GET MEMBRE PAR ID
============================================================ */

export const getMemberById = async (req, res) => {
    try {
        const { id } = req.params;

        const resultat = await pool.query(
            `
            SELECT
                m.id,
                m.matricule,
                m.nom,
                m.postnom,
                m.prenom,
                m.sexe,
                m.date_naissance,
                m.telephone,
                m.telephone_secondaire,
                m.email,
                m.adresse,
                m.commune,
                m.ville,
                m.profession,
                m.photo_url,
                m.zone_id,
                m.coordination_id,
                m.status_id,
                m.fonction_id,
                m.date_adhesion,
                m.date_expiration,
                m.observations,
                m.actif,
                m.date_creation,
                m.date_modification,

                z.nom AS zone_nom,
                z.province_id,

                p.nom AS province_nom,

                c.nom AS coordination_nom

            FROM members m

            LEFT JOIN zones z
                ON z.id = m.zone_id

            LEFT JOIN provinces p
                ON p.id = z.province_id

            LEFT JOIN coordinations c
                ON c.id = m.coordination_id

            WHERE m.id = $1
            `,
            [id]
        );

        if (resultat.rows.length === 0) {
            return res.status(404).json({
                message: "Membre introuvable.",
            });
        }

        res.json(resultat.rows[0]);
    } catch (error) {
        console.error(
            "Erreur récupération membre :",
            error
        );

        res.status(500).json({
            message:
                "Erreur lors de la récupération du membre.",
        });
    }
};

/* ============================================================
   CREER UN MEMBRE
============================================================ */

export const createMember = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            nom,
            postnom,
            prenom,
            sexe,
            date_naissance,
            telephone,
            telephone_secondaire,
            email,
            adresse,
            commune,
            ville,
            profession,
            photo_url,
            zone_id,
            coordination_id,
            status_id,
            fonction_id,
            date_adhesion,
            date_expiration,
            observations,
            actif,
        } = req.body;

        /* ----------------------------------------------------
           VERIFICATIONS DE BASE
        ---------------------------------------------------- */

        if (!nom || !String(nom).trim()) {
            return res.status(400).json({
                message: "Le nom est obligatoire.",
            });
        }

        if (!prenom || !String(prenom).trim()) {
            return res.status(400).json({
                message: "Le prénom est obligatoire.",
            });
        }

        if (!zone_id) {
            return res.status(400).json({
                message: "La zone est obligatoire.",
            });
        }

        if (!coordination_id) {
            return res.status(400).json({
                message:
                    "La coordination est obligatoire.",
            });
        }

        await client.query("BEGIN");

        /* ----------------------------------------------------
           VERIFIER LA ZONE
        ---------------------------------------------------- */

        const zoneResult = await client.query(
            `
            SELECT
                id,
                nom,
                province_id
            FROM zones
            WHERE id = $1
              AND actif = TRUE
            `,
            [zone_id]
        );

        if (zoneResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "La zone sélectionnée n'existe pas.",
            });
        }

        const zone = zoneResult.rows[0];

        /* ----------------------------------------------------
           VERIFIER LA COORDINATION
        ---------------------------------------------------- */

        const coordinationResult =
            await client.query(
                `
                SELECT
                    id,
                    nom,
                    zone_id
                FROM coordinations
                WHERE id = $1
                  AND actif = TRUE
                `,
                [coordination_id]
            );

        if (
            coordinationResult.rows.length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "La coordination sélectionnée n'existe pas.",
            });
        }

        const coordination =
            coordinationResult.rows[0];

        /* ----------------------------------------------------
           VERIFICATION DE LA HIERARCHIE

           Province
              ↓
           Zone
              ↓
           Coordination
        ---------------------------------------------------- */

        if (
            String(coordination.zone_id) !==
            String(zone.id)
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "La coordination ne correspond pas à la zone sélectionnée.",
            });
        }

        /* ----------------------------------------------------
           GENERATION MATRICULE
        ---------------------------------------------------- */

        const annee = new Date().getFullYear();

        const matriculeResult = await client.query(`
            SELECT matricule
            FROM members
            WHERE matricule LIKE 'FEN-${annee}-%'
            ORDER BY id DESC
            LIMIT 1
        `);

        let prochainNumero = 1;

        if (matriculeResult.rows.length > 0) {
            const dernierMatricule =
                matriculeResult.rows[0].matricule;

            const correspondance =
                dernierMatricule.match(
                    /-(\d+)$/
                );

            if (correspondance) {
                prochainNumero =
                    Number(correspondance[1]) + 1;
            }
        }

        const matricule =
            `FEN-${annee}-${String(
                prochainNumero
            ).padStart(6, "0")}`;

        /* ----------------------------------------------------
           INSERTION
        ---------------------------------------------------- */

        const resultat = await client.query(
            `
            INSERT INTO members (
                matricule,
                nom,
                postnom,
                prenom,
                sexe,
                date_naissance,
                telephone,
                telephone_secondaire,
                email,
                adresse,
                commune,
                ville,
                profession,
                photo_url,
                zone_id,
                coordination_id,
                status_id,
                fonction_id,
                date_adhesion,
                date_expiration,
                observations,
                actif
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12,
                $13,
                $14,
                $15,
                $16,
                $17,
                $18,
                $19,
                $20,
                $21,
                $22
            )
            RETURNING *
            `,
            [
                matricule,
                String(nom).trim(),
                valeurOuNull(postnom),
                String(prenom).trim(),
                valeurOuNull(sexe),
                valeurOuNull(date_naissance),
                valeurOuNull(telephone),
                valeurOuNull(telephone_secondaire),
                valeurOuNull(email),
                valeurOuNull(adresse),
                valeurOuNull(commune),
                valeurOuNull(ville),
                valeurOuNull(profession),
                valeurOuNull(photo_url),
                entierOuNull(zone_id),
                entierOuNull(coordination_id),
                entierOuNull(status_id),
                entierOuNull(fonction_id),
                valeurOuNull(date_adhesion),
                valeurOuNull(date_expiration),
                valeurOuNull(observations),
                actif === undefined
                    ? true
                    : Boolean(actif),
            ]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message:
                "Membre enregistré avec succès.",
            membre: resultat.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Erreur création membre :",
            error
        );

        res.status(500).json({
            message:
                "Erreur lors de l'enregistrement du membre.",
            erreur: error.message,
        });
    } finally {
        client.release();
    }
};

/* ============================================================
   MODIFIER UN MEMBRE
============================================================ */

export const updateMember = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        const {
            nom,
            postnom,
            prenom,
            sexe,
            date_naissance,
            telephone,
            telephone_secondaire,
            email,
            adresse,
            commune,
            ville,
            profession,
            photo_url,
            zone_id,
            coordination_id,
            status_id,
            fonction_id,
            date_adhesion,
            date_expiration,
            observations,
            actif,
        } = req.body;

        if (!nom || !String(nom).trim()) {
            return res.status(400).json({
                message: "Le nom est obligatoire.",
            });
        }

        if (!prenom || !String(prenom).trim()) {
            return res.status(400).json({
                message: "Le prénom est obligatoire.",
            });
        }

        if (!zone_id) {
            return res.status(400).json({
                message: "La zone est obligatoire.",
            });
        }

        if (!coordination_id) {
            return res.status(400).json({
                message:
                    "La coordination est obligatoire.",
            });
        }

        await client.query("BEGIN");

        /* ----------------------------------------------------
           VERIFIER ZONE
        ---------------------------------------------------- */

        const zoneResult = await client.query(
            `
            SELECT id, nom, province_id
            FROM zones
            WHERE id = $1
              AND actif = TRUE
            `,
            [zone_id]
        );

        if (zoneResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "La zone sélectionnée n'existe pas.",
            });
        }

        /* ----------------------------------------------------
           VERIFIER COORDINATION
        ---------------------------------------------------- */

        const coordinationResult =
            await client.query(
                `
                SELECT id, nom, zone_id
                FROM coordinations
                WHERE id = $1
                  AND actif = TRUE
                `,
                [coordination_id]
            );

        if (
            coordinationResult.rows.length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "La coordination sélectionnée n'existe pas.",
            });
        }

        const coordination =
            coordinationResult.rows[0];

        if (
            String(coordination.zone_id) !==
            String(zone_id)
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message:
                    "La coordination ne correspond pas à la zone sélectionnée.",
            });
        }

        /* ----------------------------------------------------
           UPDATE
        ---------------------------------------------------- */

        const resultat = await client.query(
            `
            UPDATE members
            SET
                nom = $1,
                postnom = $2,
                prenom = $3,
                sexe = $4,
                date_naissance = $5,
                telephone = $6,
                telephone_secondaire = $7,
                email = $8,
                adresse = $9,
                commune = $10,
                ville = $11,
                profession = $12,
                photo_url = $13,
                zone_id = $14,
                coordination_id = $15,
                status_id = $16,
                fonction_id = $17,
                date_adhesion = $18,
                date_expiration = $19,
                observations = $20,
                actif = $21,
                date_modification = NOW()
            WHERE id = $22
            RETURNING *
            `,
            [
                String(nom).trim(),
                valeurOuNull(postnom),
                String(prenom).trim(),
                valeurOuNull(sexe),
                valeurOuNull(date_naissance),
                valeurOuNull(telephone),
                valeurOuNull(telephone_secondaire),
                valeurOuNull(email),
                valeurOuNull(adresse),
                valeurOuNull(commune),
                valeurOuNull(ville),
                valeurOuNull(profession),
                valeurOuNull(photo_url),
                entierOuNull(zone_id),
                entierOuNull(coordination_id),
                entierOuNull(status_id),
                entierOuNull(fonction_id),
                valeurOuNull(date_adhesion),
                valeurOuNull(date_expiration),
                valeurOuNull(observations),
                actif === undefined
                    ? true
                    : Boolean(actif),
                id,
            ]
        );

        if (resultat.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message:
                    "Membre introuvable.",
            });
        }

        await client.query("COMMIT");

        res.json({
            message:
                "Membre modifié avec succès.",
            membre: resultat.rows[0],
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Erreur modification membre :",
            error
        );

        res.status(500).json({
            message:
                "Erreur lors de la modification du membre.",
            erreur: error.message,
        });
    } finally {
        client.release();
    }
};

/* ============================================================
   SUPPRIMER UN MEMBRE
============================================================ */

export const deleteMember = async (req, res) => {
    try {
        const { id } = req.params;

        const resultat = await pool.query(
            `
            DELETE FROM members
            WHERE id = $1
            RETURNING id, nom, postnom, prenom
            `,
            [id]
        );

        if (resultat.rows.length === 0) {
            return res.status(404).json({
                message:
                    "Membre introuvable.",
            });
        }

        res.json({
            message:
                "Membre supprimé avec succès.",
            membre: resultat.rows[0],
        });
    } catch (error) {
        console.error(
            "Erreur suppression membre :",
            error
        );

        res.status(500).json({
            message:
                "Erreur lors de la suppression du membre.",
            erreur: error.message,
        });
    }
};