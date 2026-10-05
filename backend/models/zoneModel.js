import pool from "../config/database.js";

/**
 * Récupérer toutes les zones
 */
export const getAllZones = async () => {
    const result = await pool.query(
        `
        SELECT
            z.*,
            COUNT(m.id)::INTEGER AS nombre_membres
        FROM zones z
        LEFT JOIN members m
            ON m.zone_id = z.id
            AND m.actif = TRUE
        GROUP BY z.id
        ORDER BY z.id ASC
        `
    );

    return result.rows;
};

/**
 * Récupérer une zone par ID
 */
export const getZoneById = async (id) => {
    const result = await pool.query(
        `
        SELECT
            z.*,
            COUNT(m.id)::INTEGER AS nombre_membres
        FROM zones z
        LEFT JOIN members m
            ON m.zone_id = z.id
            AND m.actif = TRUE
        WHERE z.id = $1
        GROUP BY z.id
        `,
        [id]
    );

    return result.rows[0] || null;
};

/**
 * Créer une zone
 */
export const createZone = async (data) => {
    const result = await pool.query(
        `
        INSERT INTO zones (
            nom,
            code,
            description
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [
            data.nom,
            data.code,
            data.description || null
        ]
    );

    return result.rows[0];
};

/**
 * Modifier une zone
 */
export const updateZone = async (id, data) => {
    const result = await pool.query(
        `
        UPDATE zones
        SET
            nom = $1,
            code = $2,
            description = $3,
            date_modification = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
        `,
        [
            data.nom,
            data.code,
            data.description || null,
            id
        ]
    );

    return result.rows[0] || null;
};

/**
 * Supprimer une zone
 */
export const deleteZone = async (id) => {
    const result = await pool.query(
        `
        DELETE FROM zones
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
};