import express from "express";

import {
    getMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember
} from "../controllers/memberController.js";

import {
    verifierToken,
    autoriserRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ============================================================
// GET /api/members
// LISTE DES MEMBRES
// ============================================================
router.get(
    "/",
    verifierToken,
    getMembers
);

// ============================================================
// GET /api/members/:id
// UN MEMBRE
// ============================================================
router.get(
    "/:id",
    verifierToken,
    getMemberById
);

// ============================================================
// POST /api/members
// CREATION D'UN MEMBRE
// ============================================================
router.post(
    "/",
    verifierToken,
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    (req, res, next) => {

        console.log("========================================");
        console.log("REQUETE CREATION MEMBRE RECUE");
        console.log("BODY :", req.body);
        console.log("USER :", req.user);
        console.log("========================================");

        createMember(req, res, next);
    }
);

// ============================================================
// PUT /api/members/:id
// MODIFICATION
// ============================================================
router.put(
    "/:id",
    verifierToken,
    autoriserRoles(
        "ADMIN",
        "PRESIDENT",
        "SECRETAIRE_GENERAL"
    ),
    updateMember
);

// ============================================================
// DELETE /api/members/:id
// SUPPRESSION
// ============================================================
router.delete(
    "/:id",
    verifierToken,
    autoriserRoles("ADMIN"),
    deleteMember
);

// ============================================================
// EXPORT
// ============================================================
export default router;