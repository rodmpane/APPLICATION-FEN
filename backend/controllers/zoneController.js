import {
    getAllZones,
    getZoneById,
    createZone,
    updateZone,
    deleteZone
} from "../models/zoneModel.js";

/**
 * GET /api/zones
 */
export const getAllZonesController = async (req, res) => {
    try {
        const zones = await getAllZones();

        res.json({
            success: true,
            count: zones.length,
            zones
        });
    } catch (error) {
        console.error("Erreur récupération zones :", error);

        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des zones."
        });
    }
};

/**
 * GET /api/zones/:id
 */
export const getZoneByIdController = async (req, res) => {
    try {
        const zone = await getZoneById(req.params.id);

        if (!zone) {
            return res.status(404).json({
                success: false,
                message: "Zone introuvable."
            });
        }

        res.json({
            success: true,
            zone
        });
    } catch (error) {
        console.error("Erreur récupération zone :", error);

        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de la zone."
        });
    }
};

/**
 * POST /api/zones
 */
export const createZoneController = async (req, res) => {
    try {
        const { nom, code } = req.body;

        if (!nom || !code) {
            return res.status(400).json({
                success: false,
                message: "Le nom et le code de la zone sont obligatoires."
            });
        }

        const zone = await createZone(req.body);

        res.status(201).json({
            success: true,
            message: "Zone créée avec succès.",
            zone
        });
    } catch (error) {
        console.error("Erreur création zone :", error);

        res.status(500).json({
            success: false,
            message: "Erreur lors de la création de la zone.",
            error: error.message
        });
    }
};

/**
 * PUT /api/zones/:id
 */
export const updateZoneController = async (req, res) => {
    try {
        const zone = await updateZone(
            req.params.id,
            req.body
        );

        if (!zone) {
            return res.status(404).json({
                success: false,
                message: "Zone introuvable."
            });
        }

        res.json({
            success: true,
            message: "Zone modifiée avec succès.",
            zone
        });
    } catch (error) {
        console.error("Erreur modification zone :", error);

        res.status(500).json({
            success: false,
            message: "Erreur lors de la modification de la zone.",
            error: error.message
        });
    }
};

/**
 * DELETE /api/zones/:id
 */
export const deleteZoneController = async (req, res) => {
    try {
        const zone = await deleteZone(req.params.id);

        if (!zone) {
            return res.status(404).json({
                success: false,
                message: "Zone introuvable."
            });
        }

        res.json({
            success: true,
            message: "Zone supprimée avec succès.",
            zone
        });
    } catch (error) {
        console.error("Erreur suppression zone :", error);

        res.status(500).json({
            success: false,
            message: "Impossible de supprimer cette zone.",
            error: error.message
        });
    }
};