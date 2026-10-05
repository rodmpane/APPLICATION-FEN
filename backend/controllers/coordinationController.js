import {
    getAllCoordinations,
    getCoordinationsByZone,
    getCoordinationById,
    createCoordination,
    updateCoordination,
    deleteCoordination
} from "../models/coordinationModel.js";

/**
 * GET /api/coordinations
 */
export const getAllCoordinationsController = async (req, res) => {
    try {
        const coordinations = await getAllCoordinations();

        res.json({
            success: true,
            count: coordinations.length,
            coordinations
        });
    } catch (error) {
        console.error("Erreur récupération coordinations :", error);

        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des coordinations."
        });
    }
};

/**
 * GET /api/coordinations/zone/:zoneId
 */
export const getCoordinationsByZoneController = async (req, res) => {
    try {
        const coordinations = await getCoordinationsByZone(
            req.params.zoneId
        );

        res.json({
            success: true,
            count: coordinations.length,
            coordinations
        });
    } catch (error) {
        console.error(
            "Erreur récupération coordinations par zone :",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération des coordinations."
        });
    }
};

/**
 * GET /api/coordinations/:id
 */
export const getCoordinationByIdController = async (req, res) => {
    try {
        const coordination = await getCoordinationById(
            req.params.id
        );

        if (!coordination) {
            return res.status(404).json({
                success: false,
                message: "Coordination introuvable."
            });
        }

        res.json({
            success: true,
            coordination
        });
    } catch (error) {
        console.error("Erreur récupération coordination :", error);

        res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération de la coordination."
        });
    }
};

/**
 * POST /api/coordinations
 */
export const createCoordinationController = async (req, res) => {
    try {
        const { zone_id, nom, code } = req.body;

        if (!zone_id || !nom || !code) {
            return res.status(400).json({
                success: false,
                message:
                    "La zone, le nom et le code sont obligatoires."
            });
        }

        const coordination = await createCoordination(req.body);

        res.status(201).json({
            success: true,
            message: "Coordination créée avec succès.",
            coordination
        });
    } catch (error) {
        console.error("Erreur création coordination :", error);

        res.status(500).json({
            success: false,
            message:
                "Erreur lors de la création de la coordination.",
            error: error.message
        });
    }
};

/**
 * PUT /api/coordinations/:id
 */
export const updateCoordinationController = async (req, res) => {
    try {
        const coordination = await updateCoordination(
            req.params.id,
            req.body
        );

        if (!coordination) {
            return res.status(404).json({
                success: false,
                message: "Coordination introuvable."
            });
        }

        res.json({
            success: true,
            message: "Coordination modifiée avec succès.",
            coordination
        });
    } catch (error) {
        console.error(
            "Erreur modification coordination :",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Erreur lors de la modification de la coordination.",
            error: error.message
        });
    }
};

/**
 * DELETE /api/coordinations/:id
 */
export const deleteCoordinationController = async (req, res) => {
    try {
        const coordination = await deleteCoordination(
            req.params.id
        );

        if (!coordination) {
            return res.status(404).json({
                success: false,
                message: "Coordination introuvable."
            });
        }

        res.json({
            success: true,
            message: "Coordination supprimée avec succès.",
            coordination
        });
    } catch (error) {
        console.error(
            "Erreur suppression coordination :",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Impossible de supprimer cette coordination.",
            error: error.message
        });
    }
};