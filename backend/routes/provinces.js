import express from "express";

import {
    getAllProvincesController,
    getProvinceByIdController,
    getZonesByProvinceController,
    getProvincialCoordinatorController
} from "../controllers/provinceController.js";

import {
    authentifier,
    autoriserRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PROVINCES — FONDATION ÉZÉCHIEL NTAL
|--------------------------------------------------------------------------
*/

/**
 * GET /api/provinces
 *
 * Voir toutes les provinces
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
    getAllProvincesController
);


/**
 * GET /api/provinces/:id
 *
 * Voir une province
 */
router.get(
    "/:id",
    authentifier,
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    getProvinceByIdController
);


/**
 * GET /api/provinces/:id/zones
 *
 * Voir les zones d'une province
 */
router.get(
    "/:id/zones",
    authentifier,
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    getZonesByProvinceController
);


/**
 * GET /api/provinces/:id/coordinator
 *
 * Voir le coordinateur provincial
 */
router.get(
    "/:id/coordinator",
    authentifier,
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    getProvincialCoordinatorController
);

export default router;