import express from "express";

import {
    getAllCoordinationsController,
    getCoordinationsByZoneController,
    getCoordinationByIdController,
    createCoordinationController,
    updateCoordinationController,
    deleteCoordinationController
} from "../controllers/coordinationController.js";

import {
    authentifier,
    autoriserRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| COORDINATIONS — FONDATION ÉZÉCHIEL NTAL
|--------------------------------------------------------------------------
*/

/**
 * GET /api/coordinations
 *
 * Voir toutes les coordinations
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
    getAllCoordinationsController
);


/**
 * GET /api/coordinations/zone/:zoneId
 *
 * Voir les coordinations d'une zone
 */
router.get(
    "/zone/:zoneId",
    authentifier,
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    getCoordinationsByZoneController
);


/**
 * GET /api/coordinations/:id
 *
 * Voir une coordination
 */
router.get(
    "/:id",
    authentifier,
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    getCoordinationByIdController
);


/**
 * POST /api/coordinations
 *
 * Créer une coordination
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
    createCoordinationController
);


/**
 * PUT /api/coordinations/:id
 *
 * Modifier une coordination
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
    updateCoordinationController
);


/**
 * DELETE /api/coordinations/:id
 *
 * Supprimer une coordination
 *
 * ADMIN uniquement
 */
router.delete(
    "/:id",
    authentifier,
    autoriserRoles("ADMIN"),
    deleteCoordinationController
);

export default router;