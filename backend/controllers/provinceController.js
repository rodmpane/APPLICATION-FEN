import {
    getAllProvinces,
    getProvinceById,
    getZonesByProvince,
    getProvincialCoordinator
} from "../models/provinceModel.js";


/**
 * GET /api/provinces
 */
export const getAllProvincesController = async (req, res) => {
    try {
        const provinces = await getAllProvinces();

        return res.json({
            success: true,
            count: provinces.length,
            provinces
        });

    } catch (error) {
        console.error(
            "Erreur récupération provinces :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération des provinces."
        });
    }
};


/**
 * GET /api/provinces/:id
 */
export const getProvinceByIdController = async (req, res) => {
    try {
        const province = await getProvinceById(
            req.params.id
        );

        if (!province) {
            return res.status(404).json({
                success: false,
                message: "Province introuvable."
            });
        }

        return res.json({
            success: true,
            province
        });

    } catch (error) {
        console.error(
            "Erreur récupération province :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération de la province."
        });
    }
};


/**
 * GET /api/provinces/:id/zones
 */
export const getZonesByProvinceController = async (
    req,
    res
) => {
    try {
        const zones = await getZonesByProvince(
            req.params.id
        );

        return res.json({
            success: true,
            count: zones.length,
            zones
        });

    } catch (error) {
        console.error(
            "Erreur récupération zones de la province :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération des zones."
        });
    }
};


/**
 * GET /api/provinces/:id/coordinator
 */
export const getProvincialCoordinatorController = async (
    req,
    res
) => {
    try {
        const coordinator =
            await getProvincialCoordinator(
                req.params.id
            );

        if (!coordinator) {
            return res.status(404).json({
                success: false,
                message:
                    "Coordinateur provincial introuvable."
            });
        }

        return res.json({
            success: true,
            coordinator
        });

    } catch (error) {
        console.error(
            "Erreur récupération coordinateur provincial :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération du coordinateur provincial."
        });
    }
};