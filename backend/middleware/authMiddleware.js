import jwt from "jsonwebtoken";

/*
|--------------------------------------------------------------------------
| AUTHENTIFICATION JWT
|--------------------------------------------------------------------------
*/

/**
 * Vérifie que l'utilisateur possède un token JWT valide.
 */
export const authentifier = (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (
            !authorization ||
            !authorization.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Authentification requise."
            });
        }

        const token = authorization.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token d'authentification manquant."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error(
                "JWT_SECRET absent du fichier .env"
            );

            return res.status(500).json({
                success: false,
                message: "Configuration de sécurité absente."
            });
        }

        const utilisateur = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        /*
         * Normalisation du rôle.
         *
         * Exemple :
         * admin  -> ADMIN
         * Admin  -> ADMIN
         * ADMIN  -> ADMIN
         */
        if (utilisateur.role) {
            utilisateur.role =
                String(utilisateur.role)
                    .trim()
                    .toUpperCase();
        }

        req.utilisateur = utilisateur;

        next();

    } catch (error) {
        console.error(
            "Erreur authentification :",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Session invalide ou expirée."
        });
    }
};


/*
|--------------------------------------------------------------------------
| AUTORISATION PAR RÔLE
|--------------------------------------------------------------------------
*/

export const autoriserRoles = (...rolesAutorises) => {
    return (req, res, next) => {

        if (!req.utilisateur) {
            return res.status(401).json({
                success: false,
                message: "Authentification requise."
            });
        }

        const roleUtilisateur =
            String(req.utilisateur.role || "")
                .trim()
                .toUpperCase();

        const rolesNormalises =
            rolesAutorises.map((role) =>
                String(role)
                    .trim()
                    .toUpperCase()
            );

        if (
            !rolesNormalises.includes(
                roleUtilisateur
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Vous n'avez pas l'autorisation d'effectuer cette action."
            });
        }

        next();
    };
};


/*
|--------------------------------------------------------------------------
| COMPATIBILITÉ AVEC LES ANCIENNES ROUTES
|--------------------------------------------------------------------------
*/

export const verifierToken = authentifier;