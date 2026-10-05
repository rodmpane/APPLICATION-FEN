import express from "express";

import {
    getAllZonesController,
    getZoneByIdController,
    createZoneController,
    updateZoneController,
    deleteZoneController
} from "../controllers/zoneController.js";

import {
    authentifier,
    autoriserRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ZONES — FONDATION ÉZÉCHIEL NTAL
|--------------------------------------------------------------------------
*/

/**
 * GET /api/zones
 *
 * Voir toutes les zones
 *
 * ADMIN
 * PRESIDENT
 * SECRETAIRE_GENERAL
 */
router.get(
    "/",
    authentifier,
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    getAllZonesController
);


/**
 * GET /api/zones/:id
 *
 * Voir une zone
 */
router.get(
    "/:id",
    authentifier,
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    getZoneByIdController
);


/**
 * POST /api/zones
 *
 * Créer une zone
 *
 * ADMIN + SECRETAIRE_GENERAL
 */
router.post(
    "/",
    authentifier,
    autoriserRoles(
        "ADMIN",
        "SECRETAIRE_GENERAL"
    ),
    createZoneController
);


/**
 * PUT /api/zones/:id
 *
 * Modifier une zone
 *
 * ADMIN + SECRETAIRE_GENERAL
 */
router.put(
    "/:id",
    authentifier,
    autoriserRoles(
        "ADMIN",
        "SECRETAIRE_GENERAL"
    ),
    updateZoneController
);


/**
 * DELETE /api/zones/:id
 *
 * Supprimer une zone
 *
 * ADMIN uniquement
 */
router.delete(
    "/:id",
    authentifier,
    autoriserRoles(
        "ADMIN"
    ),
    deleteZoneController
);

export default router;