import pool from "../config/database.js";

// ============================================================
// TOUS LES DIRIGEANTS
// ============================================================

export const getFoundationLeaders = async () => {
    const result = await pool.query(`
        SELECT
            id,
            nom,
            postnom,
            prenom,
            fonction,
            telephone,
            email,
            photo_url,
            actif,
            date_creation,
            date_modification
        FROM foundation_leaders
        WHERE actif = TRUE
        ORDER BY id ASC
    `);

    return result.rows;
};

// ============================================================
// PRESIDENT
// ============================================================

export const getFoundationPresident = async () => {
    const leaders = await getFoundationLeaders();

    return (
        leaders.find(
            (leader) => Number(leader.id) === 1
        ) || null
    );
};

// ============================================================
// SECRETAIRE
// ============================================================

export const getFoundationSecretary = async () => {
    const leaders = await getFoundationLeaders();

    return (
        leaders.find(
            (leader) => Number(leader.id) === 2
        ) || null
    );
};

// ============================================================
// COORDINATEURS NATIONAUX
// ============================================================

export const getFoundationCoordinators = async () => {
    const result = await pool.query(`
        SELECT
            id,
            nom,
            postnom,
            prenom,
            fonction,
            telephone,
            email,
            photo_url,
            actif,
            date_creation,
            date_modification
        FROM foundation_leaders
        WHERE actif = TRUE
        AND LOWER(fonction) LIKE 'coordinateur%'
        AND id NOT IN (1, 2)
        ORDER BY id ASC
    `);

    return result.rows;
};

// ============================================================
// STRUCTURE COMPLETE
// ============================================================

export const getFoundationStructure = async () => {

    // --------------------------------------------------------
    // DIRIGEANTS
    // --------------------------------------------------------

    const leaders = await getFoundationLeaders();

    const president =
        leaders.find(
            (leader) => Number(leader.id) === 1
        ) || null;

    const secretary =
        leaders.find(
            (leader) => Number(leader.id) === 2
        ) || null;

    const nationalCoordinators =
        leaders.filter(
            (leader) =>
                Number(leader.id) !== 1 &&
                Number(leader.id) !== 2 &&
                String(leader.fonction || "")
                    .toLowerCase()
                    .includes("coordinateur")
        );

    // --------------------------------------------------------
    // PROVINCES
    // --------------------------------------------------------

    const provincesResult = await pool.query(`
        SELECT
            p.id,
            p.nom,
            p.code,
            p.description,
            p.actif
        FROM provinces p
        WHERE p.actif = TRUE
        ORDER BY p.id ASC
    `);

    const provinces = [];

    for (const province of provincesResult.rows) {

        // ----------------------------------------------------
        // COORDINATEUR PROVINCIAL
        // ----------------------------------------------------

        const coordinatorResult = await pool.query(
            `
            SELECT
                pc.id,
                pc.nom,
                pc.postnom,
                pc.prenom,
                pc.telephone,
                pc.email,
                pc.photo_url,
                pc.actif
            FROM provincial_coordinators pc
            WHERE pc.province_id = $1
            AND pc.actif = TRUE
            ORDER BY pc.id ASC
            LIMIT 1
            `,
            [province.id]
        );

        // ----------------------------------------------------
        // ZONES
        // ----------------------------------------------------

        const zonesResult = await pool.query(
            `
            SELECT
                z.id,
                z.nom,
                z.code,
                z.description,
                z.actif
            FROM zones z
            WHERE z.province_id = $1
            AND z.actif = TRUE
            ORDER BY z.id ASC
            `,
            [province.id]
        );

        const zones = [];

        for (const zone of zonesResult.rows) {

            // ------------------------------------------------
            // COORDINATIONS
            // ------------------------------------------------

            const coordinationsResult = await pool.query(
                `
                SELECT
                    c.id,
                    c.nom,
                    c.code,
                    c.description,
                    c.actif,
                    COUNT(m.id)::INTEGER AS nombre_membres
                FROM coordinations c
                LEFT JOIN members m
                    ON m.coordination_id = c.id
                    AND m.actif = TRUE
                WHERE c.zone_id = $1
                AND c.actif = TRUE
                GROUP BY c.id
                ORDER BY c.id ASC
                `,
                [zone.id]
            );

            zones.push({
                ...zone,
                coordinations: coordinationsResult.rows
            });
        }

        provinces.push({
            ...province,
            coordinateur_provincial:
                coordinatorResult.rows[0] || null,
            zones
        });
    }

    return {
        president,
        secretary,
        nationalCoordinators,
        provinces
    };
};