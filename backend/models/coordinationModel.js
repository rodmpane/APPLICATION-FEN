import pool from "../config/database.js";

/**
 * Récupérer toutes les coordinations
 */
export const getAllCoordinations = async () => {
    const result = await pool.query(
        `
        SELECT
            c.*,
            z.nom AS zone_nom,
            z.code AS zone_code,
            p.nom AS province_nom,
            p.code AS province_code,
            COUNT(m.id)::INTEGER AS nombre_membres
        FROM coordinations c
        LEFT JOIN zones z
            ON z.id = c.zone_id
        LEFT JOIN provinces p
            ON p.id = z.province_id
        LEFT JOIN members m
            ON m.coordination_id = c.id
            AND m.actif = TRUE
        GROUP BY c.id, z.id, p.id
        ORDER BY c.id ASC
        `
    );

    return result.rows;
};


/**
 * Récupérer les coordinations d'une zone
 */
export const getCoordinationsByZone = async (zoneId) => {
    const result = await pool.query(
        `
        SELECT
            c.*,
            z.nom AS zone_nom,
            z.code AS zone_code,
            p.nom AS province_nom,
            p.code AS province_code,
            COUNT(m.id)::INTEGER AS nombre_membres
        FROM coordinations c
        LEFT JOIN zones z
            ON z.id = c.zone_id
        LEFT JOIN provinces p
            ON p.id = z.province_id
        LEFT JOIN members m
            ON m.coordination_id = c.id
            AND m.actif = TRUE
        WHERE c.zone_id = $1
        GROUP BY c.id, z.id, p.id
        ORDER BY c.id ASC
        `,
        [zoneId]
    );

    return result.rows;
};


/**
 * Récupérer une coordination par ID
 */
export const getCoordinationById = async (id) => {
    const result = await pool.query(
        `
        SELECT
            c.*,
            z.nom AS zone_nom,
            z.code AS zone_code,
            p.nom AS province_nom,
            p.code AS province_code,
            COUNT(m.id)::INTEGER AS nombre_membres
        FROM coordinations c
        LEFT JOIN zones z
            ON z.id = c.zone_id
        LEFT JOIN provinces p
            ON p.id = z.province_id
        LEFT JOIN members m
            ON m.coordination_id = c.id
            AND m.actif = TRUE
        WHERE c.id = $1
        GROUP BY c.id, z.id, p.id
        `,
        [id]
    );

    return result.rows[0] || null;
};


/**
 * Créer une coordination
 */
export const createCoordination = async (data) => {
    const result = await pool.query(
        `
        INSERT INTO coordinations (
            zone_id,
            nom,
            code,
            description
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
            data.zone_id,
            data.nom,
            data.code,
            data.description || null
        ]
    );

    return result.rows[0];
};


/**
 * Modifier une coordination
 */
export const updateCoordination = async (id, data) => {
    const result = await pool.query(
        `
        UPDATE coordinations
        SET
            zone_id = $1,
            nom = $2,
            code = $3,
            description = $4,
            date_modification = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
        `,
        [
            data.zone_id,
            data.nom,
            data.code,
            data.description || null,
            id
        ]
    );

    return result.rows[0] || null;
};


/**
 * Supprimer une coordination
 */
export const deleteCoordination = async (id) => {
    const result = await pool.query(
        `
        DELETE FROM coordinations
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0] || null;
};