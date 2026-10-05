import express from "express";

import {
    generateMemberCardController,
    getActiveMemberCardController,
    generateMemberCardPdfController,
    verifyMemberCardController
} from "../controllers/cardController.js";

import {
    verifierToken,
    autoriserRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CARTES DE MEMBRES — F.E.N.
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| VÉRIFICATION PUBLIQUE DU QR CODE
|--------------------------------------------------------------------------
|
| Cette route reste accessible sans connexion.
|
| GET /api/cards/verify/:qrToken
|
|--------------------------------------------------------------------------
*/

router.get(
    "/verify/:qrToken",
    verifyMemberCardController
);


/*
|--------------------------------------------------------------------------
| ROUTES PROTÉGÉES
|--------------------------------------------------------------------------
*/

router.use(verifierToken);


/*
|--------------------------------------------------------------------------
| GÉNÉRER UNE CARTE
|--------------------------------------------------------------------------
|
| ADMIN + SECRETAIRE_GENERAL
|
|--------------------------------------------------------------------------
*/

router.post(
    "/member/:memberId/generate",
    autoriserRoles(
        "ADMIN",
        "SECRETAIRE_GENERAL"
    ),
    generateMemberCardController
);


/*
|--------------------------------------------------------------------------
| CONSULTER UNE CARTE
|--------------------------------------------------------------------------
|
| ADMIN + PRESIDENT + SECRETAIRE_GENERAL
|
|--------------------------------------------------------------------------
*/

router.get(
    "/member/:memberId",
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    getActiveMemberCardController
);


/*
|--------------------------------------------------------------------------
| GÉNÉRER / AFFICHER LE PDF
|--------------------------------------------------------------------------
|
| ADMIN + PRESIDENT + SECRETAIRE_GENERAL
|
|--------------------------------------------------------------------------
*/

router.get(
    "/member/:memberId/pdf",
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    generateMemberCardPdfController
);


export default router;