import pool from "../config/database.js";

/**
 * Récupérer toutes les provinces
 * avec leur coordinateur provincial
 * et le nombre de zones
 */
export const getAllProvinces = async () => {
    const result = await pool.query(
        `
        SELECT
            p.*,

            pc.id AS coordinateur_id,
            pc.nom AS coordinateur_nom,
            pc.postnom AS coordinateur_postnom,
            pc.prenom AS coordinateur_prenom,
            pc.telephone AS coordinateur_telephone,
            pc.email AS coordinateur_email,

            COUNT(DISTINCT z.id)::INTEGER AS nombre_zones

        FROM provinces p

        LEFT JOIN provincial_coordinators pc
            ON pc.province_id = p.id
            AND pc.actif = TRUE

        LEFT JOIN zones z
            ON z.province_id = p.id
            AND z.actif = TRUE

        WHERE p.actif = TRUE

        GROUP BY
            p.id,
            pc.id

        ORDER BY p.id ASC
        `
    );

    return result.rows;
};


/**
 * Récupérer une province par ID
 */
export const getProvinceById = async (id) => {
    const result = await pool.query(
        `
        SELECT
            p.*,

            pc.id AS coordinateur_id,
            pc.nom AS coordinateur_nom,
            pc.postnom AS coordinateur_postnom,
            pc.prenom AS coordinateur_prenom,
            pc.telephone AS coordinateur_telephone,
            pc.email AS coordinateur_email,

            COUNT(DISTINCT z.id)::INTEGER AS nombre_zones

        FROM provinces p

        LEFT JOIN provincial_coordinators pc
            ON pc.province_id = p.id
            AND pc.actif = TRUE

        LEFT JOIN zones z
            ON z.province_id = p.id
            AND z.actif = TRUE

        WHERE p.id = $1
        AND p.actif = TRUE

        GROUP BY
            p.id,
            pc.id
        `,
        [id]
    );

    return result.rows[0] || null;
};


/**
 * Récupérer les zones d'une province
 */
export const getZonesByProvince = async (provinceId) => {
    const result = await pool.query(
        `
        SELECT
            z.*,
            COUNT(m.id)::INTEGER AS nombre_membres

        FROM zones z

        LEFT JOIN members m
            ON m.zone_id = z.id
            AND m.actif = TRUE

        WHERE z.province_id = $1
        AND z.actif = TRUE

        GROUP BY z.id

        ORDER BY z.id ASC
        `,
        [provinceId]
    );

    return result.rows;
};


/**
 * Récupérer le coordinateur provincial
 */
export const getProvincialCoordinator = async (provinceId) => {
    const result = await pool.query(
        `
        SELECT
            pc.*
        FROM provincial_coordinators pc
        WHERE pc.province_id = $1
        AND pc.actif = TRUE
        ORDER BY pc.id ASC
        LIMIT 1
        `,
        [provinceId]
    );

    return result.rows[0] || null;
};