import pool from "../config/database.js";

/**
 * Générer le prochain matricule FEN
 */
export const generateMatricule = async () => {
    const annee = new Date().getFullYear();

    const result = await pool.query(
        `
        SELECT matricule
        FROM members
        WHERE matricule LIKE $1
        ORDER BY id DESC
        LIMIT 1
        `,
        [`FEN-${annee}-%`]
    );

    let numero = 1;

    if (result.rows.length > 0) {
        const dernierMatricule = result.rows[0].matricule;
        const partieNumero = dernierMatricule.split("-")[2];

        numero = parseInt(partieNumero, 10) + 1;
    }

    return `FEN-${annee}-${String(numero).padStart(6, "0")}`;
};

/**
 * Créer un membre
 */
export const createMember = async (data) => {
    const matricule = await generateMatricule();

    const result = await pool.query(
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
            observations
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        RETURNING *
        `,
        [
            matricule,
            data.nom,
            data.postnom || null,
            data.prenom,
            data.sexe || null,
            data.date_naissance || null,
            data.telephone,
            data.telephone_secondaire || null,
            data.email || null,
            data.adresse || null,
            data.commune || null,
            data.ville || null,
            data.profession || null,
            data.photo_url || null,
            data.zone_id,
            data.coordination_id,
            data.status_id,
            data.fonction_id || null,
            data.date_adhesion || new Date(),
            data.date_expiration || null,
            data.observations || null
        ]
    );

    return result.rows[0];
};

/**
 * Récupérer tous les membres
 */
export const getAllMembers = async () => {
    const result = await pool.query(
        `
        SELECT
            m.*,
            z.nom AS zone_nom,
            z.code AS zone_code,
            c.nom AS coordination_nom,
            c.code AS coordination_code,
            s.nom AS statut_nom,
            f.nom AS fonction_nom
        FROM members m
        LEFT JOIN zones z
            ON z.id = m.zone_id
        LEFT JOIN coordinations c
            ON c.id = m.coordination_id
        LEFT JOIN member_statuses s
            ON s.id = m.status_id
        LEFT JOIN member_functions f
            ON f.id = m.fonction_id
        WHERE m.actif = TRUE
        ORDER BY m.id DESC
        `
    );

    return result.rows;
};

/**
 * Rechercher des membres
 */
export const searchMembers = async (filters = {}) => {
    const {
        recherche,
        zone_id,
        coordination_id,
        status_id
    } = filters;

    const conditions = ["m.actif = TRUE"];
    const values = [];

    if (recherche && recherche.trim() !== "") {
        values.push(`%${recherche.trim()}%`);

        conditions.push(`
            (
                m.matricule ILIKE $${values.length}
                OR m.nom ILIKE $${values.length}
                OR m.postnom ILIKE $${values.length}
                OR m.prenom ILIKE $${values.length}
                OR m.telephone ILIKE $${values.length}
                OR m.telephone_secondaire ILIKE $${values.length}
                OR m.email ILIKE $${values.length}
            )
        `);
    }

    if (zone_id) {
        values.push(zone_id);
        conditions.push(`m.zone_id = $${values.length}`);
    }

    if (coordination_id) {
        values.push(coordination_id);
        conditions.push(`m.coordination_id = $${values.length}`);
    }

    if (status_id) {
        values.push(status_id);
        conditions.push(`m.status_id = $${values.length}`);
    }

    const result = await pool.query(
        `
        SELECT
            m.*,
            z.nom AS zone_nom,
            z.code AS zone_code,
            c.nom AS coordination_nom,
            c.code AS coordination_code,
            s.nom AS statut_nom,
            f.nom AS fonction_nom
        FROM members m
        LEFT JOIN zones z
            ON z.id = m.zone_id
        LEFT JOIN coordinations c
            ON c.id = m.coordination_id
        LEFT JOIN member_statuses s
            ON s.id = m.status_id
        LEFT JOIN member_functions f
            ON f.id = m.fonction_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY m.id DESC
        `,
        values
    );

    return result.rows;
};

/**
 * Récupérer un membre par son ID
 */
export const getMemberById = async (id) => {
    const result = await pool.query(
        `
        SELECT
            m.*,
            z.nom AS zone_nom,
            z.code AS zone_code,
            c.nom AS coordination_nom,
            c.code AS coordination_code,
            s.nom AS statut_nom,
            f.nom AS fonction_nom
        FROM members m
        LEFT JOIN zones z
            ON z.id = m.zone_id
        LEFT JOIN coordinations c
            ON c.id = m.coordination_id
        LEFT JOIN member_statuses s
            ON s.id = m.status_id
        LEFT JOIN member_functions f
            ON f.id = m.fonction_id
        WHERE m.id = $1
        `,
        [id]
    );

    return result.rows[0] || null;
};

/**
 * Modifier un membre
 */
export const updateMember = async (id, data) => {
    const result = await pool.query(
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
            date_expiration = $18,
            observations = $19,
            date_modification = CURRENT_TIMESTAMP
        WHERE id = $20
        RETURNING *
        `,
        [
            data.nom,
            data.postnom || null,
            data.prenom,
            data.sexe || null,
            data.date_naissance || null,
            data.telephone,
            data.telephone_secondaire || null,
            data.email || null,
            data.adresse || null,
            data.commune || null,
            data.ville || null,
            data.profession || null,
            data.photo_url || null,
            data.zone_id,
            data.coordination_id,
            data.status_id,
            data.fonction_id || null,
            data.date_expiration || null,
            data.observations || null,
            id
        ]
    );

    return result.rows[0] || null;
};

/**
 * Désactiver un membre
 */
export const deactivateMember = async (id) => {
    const result = await pool.query(
        `
        UPDATE members
        SET
            actif = FALSE,
            date_modification = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
};