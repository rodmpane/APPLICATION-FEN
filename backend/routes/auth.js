import express from "express";

import {
    loginController,
    meController
} from "../controllers/authController.js";

import {
    authentifier
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CONNEXION
|--------------------------------------------------------------------------
*/

router.post(
    "/login",
    loginController
);


/*
|--------------------------------------------------------------------------
| UTILISATEUR CONNECTÉ
|--------------------------------------------------------------------------
|
| GET /api/auth/me
|
| Cette route nécessite un token JWT.
|
|--------------------------------------------------------------------------
*/

router.get(
    "/me",
    authentifier,
    meController
);

export default router;