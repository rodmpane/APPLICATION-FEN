import {
    getFoundationLeaders,
    getFoundationPresident,
    getFoundationSecretary,
    getFoundationCoordinators,
    getFoundationStructure
} from "../models/foundationModel.js";

// ============================================================
// TOUS LES DIRIGEANTS
// ============================================================

export const getFoundationLeadersController = async (req, res) => {
    try {
        const leaders = await getFoundationLeaders();

        return res.json({
            success: true,
            count: leaders.length,
            leaders
        });
    } catch (error) {
        console.error("Erreur récupération dirigeants :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des dirigeants."
        });
    }
};

// ============================================================
// PRESIDENT
// ============================================================

export const getFoundationPresidentController = async (req, res) => {
    try {
        const leaders = await getFoundationLeaders();

        console.log("DIRIGEANTS RECUS :", leaders);

        const president = leaders.find((leader) => {
            const fonction = String(leader.fonction || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()
                .toLowerCase();

            console.log("FONCTION TESTEE :", fonction);

            return fonction.includes("president");
        });

        console.log("PRESIDENT TROUVE :", president);

        if (!president) {
            return res.status(404).json({
                success: false,
                message: "Président de la Fondation introuvable."
            });
        }

        return res.json({
            success: true,
            president
        });
    } catch (error) {
        console.error("Erreur récupération président :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération du président."
        });
    }
};

// ============================================================
// SECRETAIRE
// ============================================================

export const getFoundationSecretaryController = async (req, res) => {
    try {
        const leaders = await getFoundationLeaders();

        const secretary = leaders.find((leader) => {
            const fonction = String(leader.fonction || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()
                .toLowerCase();

            return fonction.includes("secretaire");
        });

        if (!secretary) {
            return res.status(404).json({
                success: false,
                message: "Secrétaire de la Fondation introuvable."
            });
        }

        return res.json({
            success: true,
            secretary
        });
    } catch (error) {
        console.error("Erreur récupération secrétaire :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération du secrétaire."
        });
    }
};

// ============================================================
// COORDINATEURS NATIONAUX
// ============================================================

export const getFoundationCoordinatorsController = async (req, res) => {
    try {
        const leaders = await getFoundationLeaders();

        const coordinators = leaders.filter((leader) => {
            const fonction = String(leader.fonction || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()
                .toLowerCase();

            return fonction.includes("coordinateur national");
        });

        return res.json({
            success: true,
            count: coordinators.length,
            coordinators
        });
    } catch (error) {
        console.error("Erreur récupération coordinateurs :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des coordinateurs."
        });
    }
};

// ============================================================
// STRUCTURE COMPLETE DE LA FONDATION
// ============================================================

export const getFoundationStructureController = async (req, res) => {
    try {
        const structure = await getFoundationStructure();

        return res.json({
            success: true,
            structure
        });
    } catch (error) {
        console.error(
            "Erreur récupération structure Fondation :",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Erreur lors de la récupération de la structure."
        });
    }
};