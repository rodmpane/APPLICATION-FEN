import fs from "fs";

import {
    generateMemberCard,
    getActiveMemberCard,
    generateMemberCardPdf,
    verifyMemberCard
} from "../models/cardModel.js";

// ============================================================
// GENERER UNE CARTE
// ============================================================

export const generateMemberCardController = async (
    req,
    res
) => {
    try {
        const memberId = Number(
            req.params.memberId
        );

        if (!Number.isInteger(memberId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Identifiant membre invalide."
            });
        }

        const result =
            await generateMemberCard(
                memberId
            );

        return res.json({
            success: true,
            message:
                "Carte générée avec succès.",
            carte: result.carte,
            membre: result.membre,
            qrDataUrl: result.qrDataUrl,
            verificationUrl:
                result.verificationUrl
        });

    } catch (error) {
        console.error(
            "Erreur génération carte :",
            error
        );

        if (
            error.message ===
            "MEMBRE_INTRouvable"
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Membre introuvable."
            });
        }

        if (
            error.message ===
            "MEMBRE_INACTIF"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Impossible de créer une carte pour un membre inactif."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la génération de la carte."
        });
    }
};

// ============================================================
// RECUPERER LA CARTE ACTIVE
// ============================================================

export const getActiveMemberCardController = async (
    req,
    res
) => {
    try {
        const memberId = Number(
            req.params.memberId
        );

        if (!Number.isInteger(memberId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Identifiant membre invalide."
            });
        }

        const result =
            await getActiveMemberCard(
                memberId
            );

        if (!result) {
            return res.status(404).json({
                success: false,
                message:
                    "Aucune carte active pour ce membre."
            });
        }

        return res.json({
            success: true,
            carte: result.carte,
            membre: result.membre,
            qrDataUrl: result.qrDataUrl,
            verificationUrl:
                result.verificationUrl
        });

    } catch (error) {
        console.error(
            "Erreur récupération carte :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération de la carte."
        });
    }
};

// ============================================================
// GENERER LE PDF
// ============================================================

export const generateMemberCardPdfController = async (
    req,
    res
) => {
    try {
        const memberId = Number(
            req.params.memberId
        );

        if (!Number.isInteger(memberId)) {
            return res.status(400).json({
                success: false,
                message:
                    "Identifiant membre invalide."
            });
        }

        const result =
            await generateMemberCardPdf(
                memberId
            );

        if (
            !fs.existsSync(
                result.fichierPath
            )
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Fichier PDF introuvable."
            });
        }

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="${result.fichierNom}"`
        );

        return res.sendFile(
            result.fichierPath
        );

    } catch (error) {
        console.error(
            "Erreur génération PDF carte :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la génération du PDF."
        });
    }
};

// ============================================================
// VERIFICATION PUBLIQUE QR CODE
// ============================================================

export const verifyMemberCardController = async (
    req,
    res
) => {
    try {
        const qrToken = String(
            req.params.qrToken || ""
        ).trim();

        if (!qrToken) {
            return res.status(400).json({
                success: false,
                message:
                    "Token QR manquant."
            });
        }

        const result =
            await verifyMemberCard(
                qrToken,
                req.ip,
                req.get("user-agent")
            );

        return res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error(
            "Erreur vérification carte :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la vérification de la carte."
        });
    }
};