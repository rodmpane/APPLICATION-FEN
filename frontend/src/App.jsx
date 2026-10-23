import React, { useEffect, useMemo, useState } from "react";
import DemandesAdhesionPage from "./DemandesAdhesionPage";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TOKEN_KEY = "fen_token";
const USER_KEY = "fen_utilisateur";

/* ============================================================
OUTILS
============================================================ */

function extraireListe(data, profondeur = 0) {
    if (Array.isArray(data)) {
        return data.map((item) => {
            if (!item || typeof item !== "object") return item;

            const id =
                item.id ??
                item.province_id ??
                item.zone_id ??
                item.coordination_id ??
                item.id_province ??
                item.id_zone ??
                item.id_coordination;

            const nom =
                item.nom ??
                item.nom_province ??
                item.province_nom ??
                item.libelle ??
                item.libellé ??
                item.name ??
                item.nom_zone ??
                item.nom_coordination ??
                "";

            return {
                ...item,
                ...(id !== undefined && id !== null ? { id } : {}),
                ...(nom ? { nom } : {}),
                ...(item.province_id == null && item.id_province != null
                    ? { province_id: item.id_province }
                    : {}),
                ...(item.zone_id == null && item.id_zone != null
                    ? { zone_id: item.id_zone }
                    : {}),
            };
        });
    }

    if (!data || typeof data !== "object" || profondeur > 4) return [];

    const cles = [
        "data",
        "provinces",
        "zones",
        "coordinations",
        "membres",
        "members",
        "rows",
        "results",
        "result",
        "items",
    ];

    for (const cle of cles) {
        if (data[cle] !== undefined) {
            const resultat = extraireListe(data[cle], profondeur + 1);
            if (resultat.length || Array.isArray(data[cle])) return resultat;
        }
    }

    return [];
}

function identifiantRelation(objet, ...cles) {
    for (const cle of cles) {
        if (objet?.[cle] !== undefined && objet?.[cle] !== null) {
            return Number(objet[cle]);
        }
    }
    return NaN;
}

function nomReference(objet) {
    return (
        objet?.nom ??
        objet?.nom_province ??
        objet?.province_nom ??
        objet?.nom_zone ??
        objet?.nom_coordination ??
        objet?.libelle ??
        objet?.name ??
        "Sans nom"
    );
}

function obtenirToken() {
return localStorage.getItem(TOKEN_KEY);
}

function obtenirUtilisateur() {
try {
return JSON.parse(localStorage.getItem(USER_KEY) || "null");
} catch {
return null;
}
}

/* ============================================================
API
============================================================ */

async function requeteAPI(endpoint, options = {}) {
const token = obtenirToken();

const {
    nePasDeconnecterSi401 = false,
    ...fetchOptions
} = options;

const headers = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers || {}),
};

if (token) {
    headers.Authorization = `Bearer ${token}`;
}

const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
});

let data = null;

try {
    data = await response.json();
} catch {
    data = null;
}

if (response.status === 401 && !nePasDeconnecterSi401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event("fen-session-expiree"));
    throw new Error("Session expirée. Veuillez vous reconnecter.");
}

if (!response.ok) {
    const erreur = new Error(
        data?.message ||
        data?.error ||
        `Erreur HTTP ${response.status}`
    );

    erreur.status = response.status;
    erreur.data = data;
    throw erreur;
}

return data;

}

/* ============================================================
FORMULAIRE PUBLIC DE DEMANDE D'ADHÉSION
Accessible sans connexion
============================================================ */

function FormulaireAdhesionPublic({ onRetour }) {
const [provinces, setProvinces] = useState([]);
const [zones, setZones] = useState([]);
const [coordinations, setCoordinations] = useState([]);

const [formulaire, setFormulaire] = useState({
    nom: "",
    postnom: "",
    prenom: "",
    sexe: "",
    date_naissance: "",
    telephone: "",
    telephone_secondaire: "",
    email: "",
    adresse: "",
    commune: "",
    ville: "",
    profession: "",
    province_id: "",
    zone_id: "",
    coordination_id: "",
});

const [chargementOptions, setChargementOptions] = useState(true);
const [chargement, setChargement] = useState(false);
const [erreur, setErreur] = useState("");
const [succes, setSucces] = useState("");

useEffect(() => {
    let actif = true;

    async function chargerOptions() {
        try {
            setChargementOptions(true);
            setErreur("");

            /*
             * Route publique : aucun token n'est nécessaire.
             */
            const response = await fetch(
                `${API_URL}/api/membership-requests/options`
            );

            let data = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    "Impossible de charger les provinces, zones et coordinations."
                );
            }

            if (!actif) return;

            setProvinces(extraireListe(data?.provinces));
            setZones(extraireListe(data?.zones));
            setCoordinations(extraireListe(data?.coordinations));
        } catch (error) {
            if (actif) {
                setErreur(
                    error.message ||
                    "Impossible de charger les données nécessaires au formulaire."
                );
            }
        } finally {
            if (actif) setChargementOptions(false);
        }
    }

    chargerOptions();

    return () => {
        actif = false;
    };
}, []);

const zonesDisponibles = useMemo(() => {
    if (!formulaire.province_id) return [];

    return zones.filter(
        (zone) =>
            identifiantRelation(zone, "province_id", "id_province", "provinceId") ===
            Number(formulaire.province_id)
    );
}, [zones, formulaire.province_id]);

const coordinationsDisponibles = useMemo(() => {
    if (!formulaire.zone_id) return [];

    return coordinations.filter(
        (coordination) =>
            identifiantRelation(coordination, "zone_id", "id_zone", "zoneId") ===
            Number(formulaire.zone_id)
    );
}, [coordinations, formulaire.zone_id]);

function modifierChamp(nom, valeur) {
    setFormulaire((ancien) => ({
        ...ancien,
        [nom]: valeur,
    }));

    setSucces("");
    setErreur("");
}

function changerProvince(e) {
    setFormulaire((ancien) => ({
        ...ancien,
        province_id: e.target.value,
        zone_id: "",
        coordination_id: "",
    }));
}

function changerZone(e) {
    setFormulaire((ancien) => ({
        ...ancien,
        zone_id: e.target.value,
        coordination_id: "",
    }));
}

async function envoyerDemande(e) {
    e.preventDefault();
    setErreur("");
    setSucces("");

    if (
        !formulaire.nom.trim() ||
        !formulaire.prenom.trim() ||
        !formulaire.telephone.trim()
    ) {
        setErreur(
            "Le nom, le prénom et le téléphone sont obligatoires."
        );
        return;
    }

    if (
        !formulaire.province_id ||
        !formulaire.zone_id ||
        !formulaire.coordination_id
    ) {
        setErreur(
            "Veuillez sélectionner la province, la zone et la coordination."
        );
        return;
    }

    const zone = zones.find(
        (item) =>
            Number(item.id) === Number(formulaire.zone_id)
    );

    if (
        !zone ||
        identifiantRelation(zone, "province_id", "id_province", "provinceId") !== Number(formulaire.province_id)
    ) {
        setErreur(
            "La zone sélectionnée ne correspond pas à la province."
        );
        return;
    }

    const coordination = coordinations.find(
        (item) =>
            Number(item.id) === Number(formulaire.coordination_id)
    );

    if (
        !coordination ||
        identifiantRelation(coordination, "zone_id", "id_zone", "zoneId") !== Number(formulaire.zone_id)
    ) {
        setErreur(
            "La coordination sélectionnée ne correspond pas à la zone."
        );
        return;
    }

    /*
     * Le backend reçoit les champs attendus par
     * creerDemandePublique.
     * province_id sert uniquement au filtrage du formulaire.
     */
    const payload = {
        nom: formulaire.nom.trim(),
        postnom: formulaire.postnom.trim(),
        prenom: formulaire.prenom.trim(),
        sexe: formulaire.sexe || null,
        date_naissance: formulaire.date_naissance || null,
        telephone: formulaire.telephone.trim(),
        telephone_secondaire:
            formulaire.telephone_secondaire.trim() || null,
        email: formulaire.email.trim() || null,
        adresse: formulaire.adresse.trim() || null,
        commune: formulaire.commune.trim() || null,
        ville: formulaire.ville.trim() || null,
        profession: formulaire.profession.trim() || null,
        zone_id: Number(formulaire.zone_id),
        coordination_id: Number(formulaire.coordination_id),
    };

    try {
        setChargement(true);

        const response = await fetch(
            `${API_URL}/api/membership-requests/public`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            }
        );

        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        if (!response.ok) {
            throw new Error(
                data?.message ||
                data?.error ||
                `Impossible d'envoyer la demande (HTTP ${response.status}).`
            );
        }

        setSucces(
            data?.message ||
            "Votre demande d'adhésion a été enregistrée. Elle est en attente de validation."
        );

        setFormulaire({
            nom: "",
            postnom: "",
            prenom: "",
            sexe: "",
            date_naissance: "",
            telephone: "",
            telephone_secondaire: "",
            email: "",
            adresse: "",
            commune: "",
            ville: "",
            profession: "",
            province_id: "",
            zone_id: "",
            coordination_id: "",
        });
    } catch (error) {
        setErreur(
            error.message ||
            "Une erreur est survenue lors de l'envoi de votre demande."
        );
    } finally {
        setChargement(false);
    }
}

function champTexte(label, nom, options = {}) {
    return (
        <div
            className={`champ ${options.classe || ""}`}
            key={nom}
        >
            <label>
                {label}
                {options.obligatoire && <em> *</em>}
            </label>

            <input
                type={options.type || "text"}
                value={formulaire[nom]}
                onChange={(e) =>
                    modifierChamp(nom, e.target.value)
                }
                placeholder={options.placeholder || label}
                required={Boolean(options.obligatoire)}
                autoComplete={options.autoComplete || "off"}
            />
        </div>
    );
}

return (
    <div className="page-connexion">
        <div className="connexion-decoration connexion-decoration-1" />
        <div className="connexion-decoration connexion-decoration-2" />

        <div
            className="connexion-card"
            style={{
                width: "min(900px, 94vw)",
                maxWidth: "900px",
                margin: "30px auto",
                maxHeight: "none",
                overflow: "visible",
            }}
        >
            <div className="connexion-logo">
                <div className="logo-fen">F.E.N</div>
                <div className="logo-asbl">ASBL</div>
            </div>

            <div className="connexion-title">
                <h1>Fondation Ézéchiel NTAL</h1>
                <p>
                    Ensemble pour l’espoir, Unis pour le changement
                </p>
            </div>

            <div className="connexion-separator" />

            <h2>Demande d'adhésion</h2>

            <p className="connexion-description">
                Remplissez ce formulaire pour soumettre votre demande
                d'adhésion à la Fondation Ézéchiel NTAL.
            </p>

            {erreur && (
                <div className="alerte alerte-erreur">
                    {erreur}
                </div>
            )}

            {succes && (
                <div
                    className="alerte"
                    style={{
                        background: "#e8f8ee",
                        color: "#176b37",
                        border: "1px solid #a8dfb8",
                        padding: "14px",
                        borderRadius: "8px",
                        marginBottom: "18px",
                    }}
                    role="status"
                >
                    <strong>Demande envoyée avec succès !</strong>
                    <p style={{ marginBottom: 0 }}>{succes}</p>
                </div>
            )}

            {chargementOptions ? (
                <div className="chargement-page">
                    <div className="spinner" />
                    Chargement des provinces et des zones...
                </div>
            ) : (
                <form
                    className="formulaire-membre"
                    onSubmit={envoyerDemande}
                >
                    <div className="form-section">
                        <div className="form-section-title">
                            <span>01</span>
                            Identité du demandeur
                        </div>

                        <div className="form-grid-3">
                            {champTexte("Nom", "nom", {
                                obligatoire: true,
                                autoComplete: "family-name",
                            })}

                            {champTexte("Postnom", "postnom")}

                            {champTexte("Prénom", "prenom", {
                                obligatoire: true,
                                autoComplete: "given-name",
                            })}

                            <div className="champ">
                                <label>Sexe</label>
                                <select
                                    value={formulaire.sexe}
                                    onChange={(e) =>
                                        modifierChamp(
                                            "sexe",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        Sélectionner
                                    </option>
                                    <option value="M">Masculin</option>
                                    <option value="F">Féminin</option>
                                </select>
                            </div>

                            {champTexte(
                                "Date de naissance",
                                "date_naissance",
                                { type: "date" }
                            )}

                            {champTexte("Profession", "profession")}
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <span>02</span>
                            Coordonnées
                        </div>

                        <div className="form-grid-3">
                            {champTexte("Téléphone", "telephone", {
                                obligatoire: true,
                                autoComplete: "tel",
                            })}

                            {champTexte(
                                "Téléphone secondaire",
                                "telephone_secondaire"
                            )}

                            {champTexte("Email", "email", {
                                type: "email",
                                autoComplete: "email",
                            })}

                            {champTexte("Adresse", "adresse", {
                                classe: "champ-large",
                                autoComplete: "street-address",
                            })}

                            {champTexte("Commune", "commune")}
                            {champTexte("Ville", "ville")}
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <span>03</span>
                            Affectation à la F.E.N
                        </div>

                        <div className="form-grid-3">
                            <div className="champ">
                                <label>
                                    Province <em>*</em>
                                </label>

                                <select
                                    value={formulaire.province_id}
                                    onChange={changerProvince}
                                    required
                                >
                                    <option value="">
                                        Sélectionner une province
                                    </option>

                                    {provinces.map((province) => (
                                        <option
                                            key={province.id}
                                            value={province.id}
                                        >
                                            {nomReference(province)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="champ">
                                <label>
                                    Zone <em>*</em>
                                </label>

                                <select
                                    value={formulaire.zone_id}
                                    onChange={changerZone}
                                    disabled={!formulaire.province_id}
                                    required
                                >
                                    <option value="">
                                        Sélectionner une zone
                                    </option>

                                    {zonesDisponibles.map((zone) => (
                                        <option
                                            key={zone.id}
                                            value={zone.id}
                                        >
                                            {nomReference(zone)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="champ">
                                <label>
                                    Coordination <em>*</em>
                                </label>

                                <select
                                    value={formulaire.coordination_id}
                                    onChange={(e) =>
                                        modifierChamp(
                                            "coordination_id",
                                            e.target.value
                                        )
                                    }
                                    disabled={!formulaire.zone_id}
                                    required
                                >
                                    <option value="">
                                        Sélectionner une coordination
                                    </option>

                                    {coordinationsDisponibles.map(
                                        (coordination) => (
                                            <option
                                                key={coordination.id}
                                                value={coordination.id}
                                            >
                                                {nomReference(coordination)}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>

                        <p
                            style={{
                                fontSize: "13px",
                                opacity: 0.8,
                                marginTop: "8px",
                            }}
                        >
                            Sélectionnez d'abord la province, ensuite
                            la zone et enfin la coordination.
                        </p>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondaire"
                            onClick={onRetour}
                            disabled={chargement}
                        >
                            ← Retour à la connexion
                        </button>

                        <button
                            type="submit"
                            className="btn btn-principal"
                            disabled={chargement}
                        >
                            {chargement
                                ? "Envoi en cours..."
                                : "Envoyer ma demande"}
                        </button>
                    </div>
                </form>
            )}

            <div className="connexion-footer">
                <strong>F.E.N ASBL</strong>
                <span>L’Amour • L’Unité • Le Travail</span>
            </div>
        </div>
    </div>
);

}

/* ============================================================
CONNEXION
============================================================ */

function LoginPage({ onConnexion, onDemanderAdhesion }) {
const [identifiant, setIdentifiant] = useState("");
const [motDePasse, setMotDePasse] = useState("");
const [chargement, setChargement] = useState(false);
const [erreur, setErreur] = useState("");

async function connecter(e) {
    e.preventDefault();
    setErreur("");

    if (!identifiant.trim() || !motDePasse) {
        setErreur("Veuillez remplir tous les champs.");
        return;
    }

    try {
        setChargement(true);

        const data = await requeteAPI("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                username: identifiant.trim(),
                email: identifiant.trim(),
                password: motDePasse,
            }),
        });

        const token =
            data?.token ||
            data?.accessToken ||
            data?.access_token;

        const utilisateur =
            data?.utilisateur ||
            data?.user ||
            data?.data?.utilisateur ||
            data?.data?.user;

        if (!token) {
            throw new Error(
                "Le serveur n'a pas retourné de token de connexion."
            );
        }

        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(
            USER_KEY,
            JSON.stringify(utilisateur || {})
        );

        onConnexion(utilisateur || {});
    } catch (error) {
        setErreur(
            error.message ||
            "Nom d'utilisateur ou mot de passe incorrect."
        );
    } finally {
        setChargement(false);
    }
}

return (
    <div className="page-connexion">
        <div className="connexion-decoration connexion-decoration-1" />
        <div className="connexion-decoration connexion-decoration-2" />

        <div className="connexion-card">
            <div className="connexion-logo">
                <div className="logo-fen">F.E.N</div>
                <div className="logo-asbl">ASBL</div>
            </div>

            <div className="connexion-title">
                <h1>Fondation Ézéchiel NTAL</h1>
                <p>
                    Ensemble pour l’espoir, Unis pour le changement
                </p>
            </div>

            <div className="connexion-separator" />

            <h2>Connexion</h2>

            <p className="connexion-description">
                Accédez à votre espace de gestion de la fondation.
            </p>

            {erreur && (
                <div className="alerte alerte-erreur">
                    {erreur}
                </div>
            )}

            <form onSubmit={connecter}>
                <div className="champ">
                    <label>Nom d'utilisateur ou email</label>
                    <input
                        type="text"
                        value={identifiant}
                        onChange={(e) =>
                            setIdentifiant(e.target.value)
                        }
                        placeholder="Votre identifiant"
                        autoComplete="username"
                    />
                </div>

                <div className="champ">
                    <label>Mot de passe</label>
                    <input
                        type="password"
                        value={motDePasse}
                        onChange={(e) =>
                            setMotDePasse(e.target.value)
                        }
                        placeholder="Votre mot de passe"
                        autoComplete="current-password"
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-principal btn-connexion"
                    disabled={chargement}
                >
                    {chargement ? "Connexion..." : "Se connecter"}
                </button>
            </form>

            <div
                style={{
                    marginTop: "18px",
                    textAlign: "center",
                }}
            >
                <p
                    style={{
                        fontSize: "13px",
                        marginBottom: "10px",
                    }}
                >
                    Vous souhaitez rejoindre la fondation ?
                </p>

                <button
                    type="button"
                    className="btn btn-secondaire"
                    onClick={onDemanderAdhesion}
                    style={{ width: "100%" }}
                >
                    ✚ Demander une adhésion
                </button>
            </div>

            <div className="connexion-footer">
                <strong>F.E.N ASBL</strong>
                <span>L’Amour • L’Unité • Le Travail</span>
            </div>
        </div>
    </div>
);

}

/* ============================================================
MENU LATÉRAL
============================================================ */

function Sidebar({
page,
setPage,
utilisateur,
deconnexion,
ouverte,
setOuverte,
}) {
const role =
utilisateur?.role ||
utilisateur?.role_nom ||
utilisateur?.profil ||
"";

const menus = [
    { id: "dashboard", label: "Tableau de bord", icon: "▦" },
    { id: "membres", label: "Membres", icon: "♟" },
    { id: "demandes", label: "Demandes d’adhésion", icon: "📩" },
    { id: "structure", label: "Structure", icon: "⌘" },
    { id: "provinces", label: "Provinces", icon: "◈" },
    { id: "zones", label: "Zones", icon: "◇" },
    { id: "coordinations", label: "Coordinations", icon: "◎" },
    { id: "parametres", label: "Paramètres", icon: "⚙" },
];

return (
    <>
        {ouverte && (
            <div
                className="sidebar-overlay"
                onClick={() => setOuverte(false)}
            />
        )}

        <aside
            className={`sidebar ${
                ouverte ? "sidebar-ouverte" : ""
            }`}
        >
            <div className="sidebar-logo">
                <div className="sidebar-logo-mark">F</div>

                <div>
                    <strong>F.E.N</strong>
                    <small>ASBL</small>
                </div>
            </div>

            <div className="sidebar-slogan">
                Ensemble pour l’espoir
            </div>

            <nav className="sidebar-menu">
                <div className="sidebar-section-title">
                    PRINCIPAL
                </div>

                {menus.map((menu) => (
                    <button
                        key={menu.id}
                        className={`sidebar-item ${
                            page === menu.id
                                ? "sidebar-item-active"
                                : ""
                        }`}
                        onClick={() => {
                            setPage(menu.id);
                            setOuverte(false);
                        }}
                    >
                        <span className="sidebar-icon">
                            {menu.icon}
                        </span>
                        <span>{menu.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-bottom">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        {(
                            utilisateur?.nom ||
                            utilisateur?.username ||
                            "F"
                        )
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div className="sidebar-user-info">
                        <strong>
                            {utilisateur?.nom ||
                                utilisateur?.username ||
                                "Utilisateur FEN"}
                        </strong>
                        <small>{role || "Utilisateur"}</small>
                    </div>
                </div>

                <button
                    className="sidebar-logout"
                    onClick={deconnexion}
                >
                    <span>↪</span>
                    Déconnexion
                </button>
            </div>
        </aside>
    </>
);

}

/* ============================================================
BARRE SUPÉRIEURE
============================================================ */

function Topbar({ titre, utilisateur, ouvrirMenu }) {
return (
<header className="topbar">
<button className="mobile-menu-button" onClick={ouvrirMenu} >
☰
</button>

        <div className="topbar-title">
            <h1>{titre}</h1>
            <p>Gestion de la Fondation Ézéchiel NTAL</p>
        </div>

        <div className="topbar-user">
            <div className="topbar-user-avatar">
                {(
                    utilisateur?.nom ||
                    utilisateur?.username ||
                    "F"
                )
                    .charAt(0)
                    .toUpperCase()}
            </div>

            <div>
                <strong>
                    {utilisateur?.nom ||
                        utilisateur?.username ||
                        "Utilisateur"}
                </strong>

                <span>
                    {utilisateur?.role ||
                        utilisateur?.role_nom ||
                        "Administrateur"}
                </span>
            </div>
        </div>
    </header>
);

}

/* ============================================================
CARTE STATISTIQUE
============================================================ */

function StatCard({
titre,
valeur,
description,
icon,
classe = "",
}) {
return (
<div className={`stat-card ${classe}`}>
<div className="stat-card-icon">{icon}</div>

        <div className="stat-card-content">
            <span>{titre}</span>
            <strong>{valeur}</strong>
            {description && <small>{description}</small>}
        </div>
    </div>
);

}

/* ============================================================
TABLEAU DE BORD
============================================================ */

function DashboardPage({
membres,
provinces,
zones,
coordinations,
utilisateur,
}) {
const actifs = membres.filter(
(m) =>
m.actif === true ||
m.actif === "true" ||
Number(m.status_id) === 1
).length;

const hommes = membres.filter(
    (m) =>
        ["M", "H"].includes(
            String(m.sexe || "").toUpperCase()
        )
).length;

const femmes = membres.filter(
    (m) =>
        String(m.sexe || "").toUpperCase() === "F"
).length;

return (
    <div className="contenu-page">
        <div className="bienvenue-card">
            <div>
                <span className="bienvenue-label">
                    ESPACE DE GESTION
                </span>

                <h2>
                    Bienvenue
                    {utilisateur?.nom
                        ? `, ${utilisateur.nom}`
                        : ""}
                </h2>

                <p>
                    Gérez les membres, les provinces, les zones
                    et les coordinations de la F.E.N depuis
                    votre tableau de bord.
                </p>
            </div>

            <div className="bienvenue-decoration">F.E.N</div>
        </div>

        <div className="section-heading">
            <div>
                <h2>Vue générale</h2>
                <p>Situation actuelle de la fondation</p>
            </div>
        </div>

        <div className="stats-grid">
            <StatCard
                titre="Membres"
                valeur={membres.length}
                description="Membres enregistrés"
                icon="♟"
            />

            <StatCard
                titre="Membres actifs"
                valeur={actifs}
                description="Actuellement actifs"
                icon="✓"
                classe="stat-card-success"
            />

            <StatCard
                titre="Provinces"
                valeur={provinces.length}
                description="Provinces enregistrées"
                icon="◈"
            />

            <StatCard
                titre="Zones"
                valeur={zones.length}
                description="Zones enregistrées"
                icon="◇"
            />

            <StatCard
                titre="Coordinations"
                valeur={coordinations.length}
                description="Coordinations enregistrées"
                icon="◎"
            />
        </div>

        <div className="dashboard-grid">
            <div className="dashboard-card">
                <div className="dashboard-card-header">
                    <div>
                        <h3>Répartition des membres</h3>
                        <p>Par sexe</p>
                    </div>
                </div>

                <div className="repartition">
                    {[
                        ["H", hommes, "Hommes"],
                        ["F", femmes, "Femmes"],
                        ["∑", membres.length, "Total"],
                    ].map(([icon, nombre, label]) => (
                        <div
                            className="repartition-item"
                            key={label}
                        >
                            <div className="repartition-icon">
                                {icon}
                            </div>

                            <div>
                                <strong>{nombre}</strong>
                                <span>{label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="dashboard-card">
                <div className="dashboard-card-header">
                    <div>
                        <h3>Hiérarchie F.E.N</h3>
                        <p>Structure actuelle</p>
                    </div>
                </div>

                <div className="hierarchie">
                    {[
                        ["01", "Coordination nationale"],
                        ["02", `${provinces.length} Provinces`],
                        ["03", `${zones.length} Zones`],
                        ["04", `${coordinations.length} Coordinations`],
                        ["05", `${membres.length} Membres`],
                    ].map(([numero, texte]) => (
                        <div key={numero}>
                            <span>{numero}</span>
                            <strong>{texte}</strong>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div
            className="dashboard-card"
            style={{ marginTop: "24px" }}
        >
            <div className="dashboard-card-header">
                <div>
                    <h3>Responsables de la F.E.N</h3>
                    <p>Direction de la fondation</p>
                </div>
            </div>

            <div className="hierarchie">
                <div>
                    <span>01</span>
                    <strong>
                        Administrateur : Rodrigues MPANE
                    </strong>
                </div>

                <div>
                    <span>02</span>
                    <strong>Président : Ézéchiel NTAL</strong>
                </div>

                <div>
                    <span>03</span>
                    <strong>
                        Secrétaire Général : Jean-claude KIKANGA
                    </strong>
                </div>
            </div>
        </div>
    </div>
);

}

/* ============================================================
MODAL MEMBRE
============================================================ */

function MembreModal({
membre,
provinces,
zones,
coordinations,
fermer,
apresEnregistrement,
}) {
const [formulaire, setFormulaire] = useState({
nom: "",
postnom: "",
prenom: "",
sexe: "M",
date_naissance: "",
telephone: "",
telephone_secondaire: "",
email: "",
adresse: "",
commune: "",
ville: "",
profession: "",
photo_url: "",
province_id: "",
zone_id: "",
coordination_id: "",
status_id: 1,
date_adhesion: "",
date_expiration: "",
observations: "",
actif: true,
});

const [chargement, setChargement] = useState(false);
const [erreur, setErreur] = useState("");

useEffect(() => {
    if (!membre) return;

    setFormulaire({
        nom: membre.nom || "",
        postnom: membre.postnom || "",
        prenom: membre.prenom || "",
        sexe: membre.sexe || "M",
        date_naissance: membre.date_naissance
            ? String(membre.date_naissance).substring(0, 10)
            : "",
        telephone: membre.telephone || "",
        telephone_secondaire: membre.telephone_secondaire || "",
        email: membre.email || "",
        adresse: membre.adresse || "",
        commune: membre.commune || "",
        ville: membre.ville || "",
        profession: membre.profession || "",
        photo_url: membre.photo_url || "",
        province_id:
            String(
                membre.province_id ??
                membre.zone_province_id ??
                membre.id_province ??
                ""
            ),
        zone_id: String(membre.zone_id ?? membre.id_zone ?? ""),
        coordination_id: String(membre.coordination_id ?? membre.id_coordination ?? ""),
        status_id: Number(membre.status_id) || 1,
        date_adhesion: membre.date_adhesion
            ? String(membre.date_adhesion).substring(0, 10)
            : "",
        date_expiration: membre.date_expiration
            ? String(membre.date_expiration).substring(0, 10)
            : "",
        observations: membre.observations || "",
        actif:
            membre.actif !== false &&
            membre.actif !== "false",
    });
}, [membre]);

const zonesDisponibles = useMemo(() => {
    if (!formulaire.province_id) return [];

    return zones.filter(
        (zone) =>
            identifiantRelation(zone, "province_id", "id_province", "provinceId") ===
            Number(formulaire.province_id)
    );
}, [zones, formulaire.province_id]);

const coordinationsDisponibles = useMemo(() => {
    if (!formulaire.zone_id) return [];

    return coordinations.filter(
        (coordination) =>
            identifiantRelation(coordination, "zone_id", "id_zone", "zoneId") ===
            Number(formulaire.zone_id)
    );
}, [coordinations, formulaire.zone_id]);

function modifierChamp(nom, valeur) {
    setFormulaire((ancien) => ({
        ...ancien,
        [nom]: valeur,
    }));
}

function changerProvince(e) {
    setFormulaire((ancien) => ({
        ...ancien,
        province_id: e.target.value,
        zone_id: "",
        coordination_id: "",
    }));
}

function changerZone(e) {
    setFormulaire((ancien) => ({
        ...ancien,
        zone_id: e.target.value,
        coordination_id: "",
    }));
}

async function enregistrer(e) {
    e.preventDefault();
    setErreur("");

    if (!formulaire.nom.trim()) {
        setErreur("Le nom est obligatoire.");
        return;
    }

    if (!formulaire.prenom.trim()) {
        setErreur("Le prénom est obligatoire.");
        return;
    }

    if (
        !formulaire.province_id ||
        !formulaire.zone_id ||
        !formulaire.coordination_id
    ) {
        setErreur(
            "Veuillez sélectionner la province, la zone et la coordination."
        );
        return;
    }

    const zone = zones.find(
        (item) =>
            Number(item.id) === Number(formulaire.zone_id)
    );

    if (
        !zone ||
        identifiantRelation(zone, "province_id", "id_province", "provinceId") !==
            Number(formulaire.province_id)
    ) {
        setErreur(
            "La zone sélectionnée ne correspond pas à la province."
        );
        return;
    }

    const coordination = coordinations.find(
        (item) =>
            Number(item.id) === Number(formulaire.coordination_id)
    );

    if (
        !coordination ||
        identifiantRelation(coordination, "zone_id", "id_zone", "zoneId") !==
            Number(formulaire.zone_id)
    ) {
        setErreur(
            "La coordination sélectionnée ne correspond pas à la zone."
        );
        return;
    }

    const payload = {
        nom: formulaire.nom.trim(),
        postnom: formulaire.postnom.trim(),
        prenom: formulaire.prenom.trim(),
        sexe: formulaire.sexe || "M",
        date_naissance: formulaire.date_naissance || null,
        telephone: formulaire.telephone.trim(),
        telephone_secondaire:
            formulaire.telephone_secondaire.trim(),
        email: formulaire.email.trim(),
        adresse: formulaire.adresse.trim(),
        commune: formulaire.commune.trim(),
        ville: formulaire.ville.trim(),
        profession: formulaire.profession.trim(),
        photo_url: formulaire.photo_url.trim(),
        zone_id: Number(formulaire.zone_id),
        coordination_id: Number(formulaire.coordination_id),
        status_id: Number(formulaire.status_id) || 1,
        date_adhesion: formulaire.date_adhesion || null,
        date_expiration: formulaire.date_expiration || null,
        observations: formulaire.observations.trim(),
        actif: Boolean(formulaire.actif),
    };

    try {
        setChargement(true);

        const data = membre?.id
            ? await requeteAPI(`/api/members/${membre.id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            })
            : await requeteAPI("/api/members", {
                method: "POST",
                body: JSON.stringify(payload),
            });

        await apresEnregistrement(data);
    } catch (error) {
        console.error(
            "Erreur lors de l'enregistrement du membre :",
            error
        );

        setErreur(
            error.message ||
            "Erreur lors de l'enregistrement du membre."
        );
    } finally {
        setChargement(false);
    }
}

function champTexte(label, nom, options = {}) {
    return (
        <div className={`champ ${options.classe || ""}`} key={nom}>
            <label>
                {label}
                {options.obligatoire && <em> *</em>}
            </label>

            <input
                type={options.type || "text"}
                value={formulaire[nom]}
                onChange={(e) =>
                    modifierChamp(nom, e.target.value)
                }
                placeholder={options.placeholder || label}
                required={Boolean(options.obligatoire)}
            />
        </div>
    );
}

return (
    <div
        className="modal-overlay"
        onMouseDown={(e) => {
            if (e.target === e.currentTarget) fermer();
        }}
    >
        <div className="modal modal-grand">
            <div className="modal-header">
                <div>
                    <span className="modal-kicker">
                        GESTION DES MEMBRES
                    </span>
                    <h2>
                        {membre
                            ? "Modifier le membre"
                            : "Nouveau membre"}
                    </h2>
                </div>

                <button
                    className="modal-close"
                    onClick={fermer}
                    type="button"
                >
                    ×
                </button>
            </div>

            {erreur && (
                <div className="alerte alerte-erreur modal-alert">
                    {erreur}
                </div>
            )}

            <form
                className="formulaire-membre"
                onSubmit={enregistrer}
            >
                <div className="form-section">
                    <div className="form-section-title">
                        <span>01</span>
                        Identité
                    </div>

                    <div className="form-grid-3">
                        {champTexte("Nom", "nom", {
                            obligatoire: true,
                        })}
                        {champTexte("Postnom", "postnom")}
                        {champTexte("Prénom", "prenom", {
                            obligatoire: true,
                        })}

                        <div className="champ">
                            <label>Sexe</label>
                            <select
                                value={formulaire.sexe}
                                onChange={(e) =>
                                    modifierChamp("sexe", e.target.value)
                                }
                            >
                                <option value="M">Masculin</option>
                                <option value="F">Féminin</option>
                            </select>
                        </div>

                        {champTexte(
                            "Date de naissance",
                            "date_naissance",
                            { type: "date" }
                        )}
                        {champTexte("Profession", "profession")}
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">
                        <span>02</span>
                        Coordonnées
                    </div>

                    <div className="form-grid-3">
                        {champTexte("Téléphone", "telephone", {
                            obligatoire: true,
                        })}
                        {champTexte(
                            "Téléphone secondaire",
                            "telephone_secondaire"
                        )}
                        {champTexte("Email", "email", {
                            type: "email",
                        })}
                        {champTexte("Adresse", "adresse", {
                            classe: "champ-large",
                        })}
                        {champTexte("Commune", "commune")}
                        {champTexte("Ville", "ville")}
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">
                        <span>03</span>
                        Affectation F.E.N
                    </div>

                    <div className="form-grid-3">
                        <div className="champ">
                            <label>Province <em>*</em></label>
                            <select
                                value={formulaire.province_id}
                                onChange={changerProvince}
                                required
                            >
                                <option value="">
                                    Sélectionner une province
                                </option>
                                {provinces.map((province) => (
                                    <option
                                        key={province.id}
                                        value={province.id}
                                    >
                                        {nomReference(province)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="champ">
                            <label>Zone <em>*</em></label>
                            <select
                                value={formulaire.zone_id}
                                onChange={changerZone}
                                disabled={!formulaire.province_id}
                                required
                            >
                                <option value="">
                                    Sélectionner une zone
                                </option>
                                {zonesDisponibles.map((zone) => (
                                    <option
                                        key={zone.id}
                                        value={zone.id}
                                    >
                                        {nomReference(zone)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="champ">
                            <label>Coordination <em>*</em></label>
                            <select
                                value={formulaire.coordination_id}
                                onChange={(e) =>
                                    modifierChamp(
                                        "coordination_id",
                                        e.target.value
                                    )
                                }
                                disabled={!formulaire.zone_id}
                                required
                            >
                                <option value="">
                                    Sélectionner une coordination
                                </option>
                                {coordinationsDisponibles.map(
                                    (coordination) => (
                                        <option
                                            key={coordination.id}
                                            value={coordination.id}
                                        >
                                            {nomReference(coordination)}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="champ">
                            <label>Statut du membre</label>
                            <select
                                value={formulaire.status_id}
                                onChange={(e) =>
                                    modifierChamp(
                                        "status_id",
                                        Number(e.target.value)
                                    )
                                }
                            >
                                <option value={1}>Actif</option>
                                <option value={2}>Inactif</option>
                                <option value={3}>Suspendu</option>
                            </select>
                        </div>

                        {champTexte(
                            "Date d'adhésion",
                            "date_adhesion",
                            { type: "date" }
                        )}
                        {champTexte(
                            "Date d'expiration",
                            "date_expiration",
                            { type: "date" }
                        )}
                    </div>
                </div>

                <div className="form-section">
                    <div className="form-section-title">
                        <span>04</span>
                        Informations complémentaires
                    </div>

                    <div className="form-grid-2">
                        {champTexte("Photo URL", "photo_url")}

                        <div className="champ champ-checkbox">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formulaire.actif}
                                    onChange={(e) =>
                                        modifierChamp(
                                            "actif",
                                            e.target.checked
                                        )
                                    }
                                />
                                <span>Membre actif</span>
                            </label>
                        </div>
                    </div>

                    <div className="champ">
                        <label>Observations</label>
                        <textarea
                            rows="4"
                            value={formulaire.observations}
                            onChange={(e) =>
                                modifierChamp(
                                    "observations",
                                    e.target.value
                                )
                            }
                            placeholder="Observations éventuelles..."
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondaire"
                        onClick={fermer}
                        disabled={chargement}
                    >
                        Annuler
                    </button>

                    <button
                        type="submit"
                        className="btn btn-principal"
                        disabled={chargement}
                    >
                        {chargement
                            ? "Enregistrement..."
                            : membre
                            ? "Enregistrer les modifications"
                            : "Enregistrer le membre"}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

}

/* ============================================================
CARTE DE MEMBRE
============================================================ */

function CarteMembreModal({ membre, fermer }) {
const [carte, setCarte] = useState(null);
const [chargement, setChargement] = useState(true);
const [erreur, setErreur] = useState("");
const [telechargement, setTelechargement] = useState(false);

useEffect(() => {
    if (membre?.id) chargerCarte();
}, [membre?.id]);

async function chargerCarte() {
    try {
        setChargement(true);
        setErreur("");

        let data;

        try {
            data = await requeteAPI(
                `/api/cards/member/${membre.id}`
            );
        } catch (error) {
            const aucuneCarte =
                error?.status === 404 ||
                String(error?.message || "")
                    .toLowerCase()
                    .includes("aucune carte active");

            if (!aucuneCarte) throw error;

            const utilisateur = obtenirUtilisateur();

            const role = String(
                utilisateur?.role ||
                utilisateur?.role_nom ||
                utilisateur?.profil ||
                ""
            )
                .trim()
                .toUpperCase();

            if (
                role !== "ADMIN" &&
                role !== "SECRETAIRE_GENERAL"
            ) {
                throw new Error(
                    "Aucune carte active pour ce membre. Seul l'administrateur ou le secrétaire général peut générer une nouvelle carte."
                );
            }

            data = await requeteAPI(
                `/api/cards/member/${membre.id}/generate`,
                { method: "POST" }
            );
        }

        setCarte(data);
    } catch (error) {
        console.error("Erreur chargement carte :", error);
        setErreur(
            error.message ||
            "Impossible de charger la carte du membre."
        );
    } finally {
        setChargement(false);
    }
}

function formaterDate(date) {
    if (!date) return "—";

    const valeur = String(date).substring(0, 10);
    const morceaux = valeur.split("-");

    if (morceaux.length !== 3) return valeur;

    return `${morceaux[2]}/${morceaux[1]}/${morceaux[0]}`;
}

async function obtenirPDF() {
    const response = await fetch(
        `${API_URL}/api/cards/member/${membre.id}/pdf`,
        {
            headers: {
                Authorization: `Bearer ${obtenirToken()}`,
            },
        }
    );

    if (!response.ok) {
        let message = `Erreur HTTP ${response.status}`;

        try {
            const data = await response.json();
            message = data?.message || data?.error || message;
        } catch {}

        throw new Error(message);
    }

    return response.blob();
}

async function telechargerPDF() {
    try {
        setTelechargement(true);
        setErreur("");

        const blob = await obtenirPDF();
        const url = window.URL.createObjectURL(blob);
        const lien = document.createElement("a");

        lien.href = url;
        lien.download =
            carte?.carte?.numero_carte ||
            `carte-membre-${membre.id}`;

        if (!lien.download.endsWith(".pdf")) {
            lien.download += ".pdf";
        }

        document.body.appendChild(lien);
        lien.click();
        lien.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        setErreur(
            error.message ||
            "Impossible de télécharger le PDF."
        );
    } finally {
        setTelechargement(false);
    }
}

async function imprimerCarte() {
    try {
        setErreur("");

        const blob = await obtenirPDF();
        const url = window.URL.createObjectURL(blob);
        const fenetre = window.open(url, "_blank");

        if (!fenetre) {
            window.URL.revokeObjectURL(url);
            throw new Error(
                "La fenêtre d'impression a été bloquée."
            );
        }

        fenetre.onload = () => {
            fenetre.focus();
            fenetre.print();
        };
    } catch (error) {
        setErreur(
            error.message ||
            "Impossible d'imprimer la carte."
        );
    }
}

const informations = carte?.membre || membre;
const donneesCarte = carte?.carte;

const nomComplet = [
    informations?.nom,
    informations?.postnom,
    informations?.prenom,
]
    .filter(Boolean)
    .join(" ");

return (
    <div
        className="modal-overlay"
        onMouseDown={(e) => {
            if (e.target === e.currentTarget) fermer();
        }}
    >
        <div className="modal modal-grand carte-modal">
            <div className="modal-header">
                <div>
                    <span className="modal-kicker">
                        CARTE DE MEMBRE
                    </span>
                    <h2>Carte de membre F.E.N</h2>
                </div>

                <button
                    className="modal-close"
                    onClick={fermer}
                    type="button"
                >
                    ×
                </button>
            </div>

            {erreur && (
                <div className="alerte alerte-erreur modal-alert">
                    {erreur}
                </div>
            )}

            {chargement ? (
                <div className="chargement-page">
                    <div className="spinner" />
                    Chargement de la carte...
                </div>
            ) : carte ? (
                <>
                    <div className="carte-preview">
                        <div className="carte-entete">
                            <div className="carte-logo">F.E.N</div>

                            <div className="carte-titre">
                                <strong>
                                    FONDATION ÉZÉCHIEL NTAL
                                </strong>
                                <span>
                                    CARTE OFFICIELLE DE MEMBRE
                                </span>
                            </div>
                        </div>

                        <div className="carte-corps">
                            <div className="carte-photo-container">
                                {informations?.photo_url ? (
                                    <img
                                        src={informations.photo_url}
                                        alt={nomComplet}
                                        className="carte-photo"
                                    />
                                ) : (
                                    <div className="carte-photo-placeholder">
                                        {(informations?.nom || "M")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="carte-informations">
                                <div className="carte-nom">
                                    {nomComplet}
                                </div>

                                {[
                                    ["Matricule", informations?.matricule],
                                    ["Téléphone", informations?.telephone],
                                    ["Province", informations?.province_nom],
                                    ["Zone", informations?.zone_nom],
                                    ["Coordination", informations?.coordination_nom],
                                ].map(([label, valeur]) => (
                                    <div
                                        className="carte-ligne"
                                        key={label}
                                    >
                                        <span>{label}</span>
                                        <strong>{valeur || "—"}</strong>
                                    </div>
                                ))}
                            </div>

                            <div className="carte-qr-container">
                                {carte.qrDataUrl ? (
                                    <img
                                        src={carte.qrDataUrl}
                                        alt="QR Code"
                                        className="carte-qr"
                                    />
                                ) : (
                                    <div className="carte-qr-placeholder">
                                        QR
                                    </div>
                                )}

                                <span>Scanner pour vérifier</span>
                            </div>
                        </div>

                        <div className="carte-pied">
                            <div>
                                <span>Numéro de carte</span>
                                <strong>
                                    {donneesCarte?.numero_carte || "—"}
                                </strong>
                            </div>

                            <div>
                                <span>Expiration</span>
                                <strong>
                                    {formaterDate(
                                        donneesCarte?.date_expiration ||
                                        informations?.date_expiration
                                    )}
                                </strong>
                            </div>

                            <div className="carte-statut">
                                ACTIVE
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondaire"
                            onClick={fermer}
                        >
                            Fermer
                        </button>

                        <button
                            type="button"
                            className="btn btn-secondaire"
                            onClick={imprimerCarte}
                        >
                            🖨 Imprimer
                        </button>

                        <button
                            type="button"
                            className="btn btn-principal"
                            onClick={telechargerPDF}
                            disabled={telechargement}
                        >
                            {telechargement
                                ? "Téléchargement..."
                                : "⬇ Télécharger PDF"}
                        </button>
                    </div>
                </>
            ) : null}
        </div>
    </div>
);

}

/* ============================================================
PAGE DES MEMBRES
============================================================ */

function MembresPage({
membres,
provinces,
zones,
coordinations,
actualiserMembres,
}) {
const [recherche, setRecherche] = useState("");
const [provinceFiltre, setProvinceFiltre] = useState("");
const [zoneFiltre, setZoneFiltre] = useState("");
const [coordinationFiltre, setCoordinationFiltre] = useState("");
const [modalOuvert, setModalOuvert] = useState(false);
const [membreSelectionne, setMembreSelectionne] = useState(null);
const [carteOuverte, setCarteOuverte] = useState(false);
const [membreCarte, setMembreCarte] = useState(null);
const [erreur, setErreur] = useState("");

const zonesFiltre = useMemo(() => {
    if (!provinceFiltre) return zones;

    return zones.filter(
        (zone) =>
            Number(zone.province_id) === Number(provinceFiltre)
    );
}, [zones, provinceFiltre]);

const coordinationsFiltre = useMemo(() => {
    if (!zoneFiltre) return coordinations;

    return coordinations.filter(
        (coordination) =>
            Number(coordination.zone_id) === Number(zoneFiltre)
    );
}, [coordinations, zoneFiltre]);

const membresFiltres = useMemo(() => {
    const texte = recherche.trim().toLowerCase();

    return membres.filter((membre) => {
        const correspondRecherche =
            !texte ||
            [
                membre.matricule,
                membre.nom,
                membre.postnom,
                membre.prenom,
                membre.telephone,
                membre.email,
                membre.province_nom,
                membre.zone_nom,
                membre.coordination_nom,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(texte);

        return (
            correspondRecherche &&
            (!provinceFiltre ||
                Number(membre.province_id) === Number(provinceFiltre)) &&
            (!zoneFiltre ||
                Number(membre.zone_id) === Number(zoneFiltre)) &&
            (!coordinationFiltre ||
                Number(membre.coordination_id) ===
                    Number(coordinationFiltre))
        );
    });
}, [
    membres,
    recherche,
    provinceFiltre,
    zoneFiltre,
    coordinationFiltre,
]);

function nouveauMembre() {
    setMembreSelectionne(null);
    setErreur("");
    setModalOuvert(true);
}

function modifierMembre(membre) {
    setMembreSelectionne(membre);
    setErreur("");
    setModalOuvert(true);
}

async function supprimerMembre(membre) {
    const confirmation = window.confirm(
        `Voulez-vous vraiment supprimer le membre ${membre.nom || ""} ${membre.prenom || ""} ?`
    );

    if (!confirmation) return;

    try {
        setErreur("");

        await requeteAPI(`/api/members/${membre.id}`, {
            method: "DELETE",
        });

        await actualiserMembres();
    } catch (error) {
        setErreur(
            error.message ||
            "Impossible de supprimer le membre."
        );
    }
}

async function apresEnregistrement() {
    await actualiserMembres();
    setModalOuvert(false);
    setMembreSelectionne(null);
}

function nomStatut(membre) {
    const id = Number(membre.status_id);

    if (id === 1) return "Actif";
    if (id === 2) return "Inactif";
    if (id === 3) return "Suspendu";

    return "—";
}

return (
    <div className="contenu-page">
        <div className="page-heading">
            <div>
                <span className="page-kicker">GESTION</span>
                <h2>Membres</h2>
                <p>
                    Gérez les membres de la Fondation Ézéchiel NTAL.
                </p>
            </div>

            <button
                className="btn btn-principal"
                onClick={nouveauMembre}
            >
                + Nouveau membre
            </button>
        </div>

        {erreur && (
            <div className="alerte alerte-erreur">
                {erreur}
            </div>
        )}

        <div className="filtres-card">
            <div className="champ recherche">
                <label>Rechercher</label>
                <input
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Nom, matricule, téléphone..."
                />
            </div>

            <div className="champ">
                <label>Province</label>
                <select
                    value={provinceFiltre}
                    onChange={(e) => {
                        setProvinceFiltre(e.target.value);
                        setZoneFiltre("");
                        setCoordinationFiltre("");
                    }}
                >
                    <option value="">Toutes les provinces</option>
                    {provinces.map((province) => (
                        <option
                            key={province.id}
                            value={province.id}
                        >
                            {nomReference(province)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="champ">
                <label>Zone</label>
                <select
                    value={zoneFiltre}
                    onChange={(e) => {
                        setZoneFiltre(e.target.value);
                        setCoordinationFiltre("");
                    }}
                >
                    <option value="">Toutes les zones</option>
                    {zonesFiltre.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                            {nomReference(zone)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="champ">
                <label>Coordination</label>
                <select
                    value={coordinationFiltre}
                    onChange={(e) =>
                        setCoordinationFiltre(e.target.value)
                    }
                >
                    <option value="">
                        Toutes les coordinations
                    </option>
                    {coordinationsFiltre.map((coordination) => (
                        <option
                            key={coordination.id}
                            value={coordination.id}
                        >
                            {nomReference(coordination)}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        <div className="table-card">
            <div className="table-card-header">
                <div>
                    <h3>Liste des membres</h3>
                    <span>
                        {membresFiltres.length} membre
                        {membresFiltres.length > 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Matricule</th>
                            <th>Membre</th>
                            <th>Téléphone</th>
                            <th>Province</th>
                            <th>Zone</th>
                            <th>Coordination</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {membresFiltres.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="table-empty">
                                    Aucun membre trouvé.
                                </td>
                            </tr>
                        ) : (
                            membresFiltres.map((membre) => (
                                <tr key={membre.id}>
                                    <td>
                                        <span className="matricule">
                                            {membre.matricule}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="membre-cell">
                                            <div className="membre-avatar">
                                                {(membre.nom || "M")
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div>
                                                <strong>
                                                    {membre.nom || ""}
                                                    {membre.postnom
                                                        ? ` ${membre.postnom}`
                                                        : ""}
                                                </strong>
                                                <span>
                                                    {membre.prenom || ""}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td>{membre.telephone || "—"}</td>
                                    <td>{membre.province_nom || "—"}</td>
                                    <td>{membre.zone_nom || "—"}</td>
                                    <td>{membre.coordination_nom || "—"}</td>

                                    <td>
                                        <span
                                            className={`badge ${
                                                Number(membre.status_id) === 1
                                                    ? "badge-actif"
                                                    : Number(membre.status_id) === 2
                                                    ? "badge-inactif"
                                                    : "badge-suspendu"
                                            }`}
                                        >
                                            {nomStatut(membre)}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                className="action-btn action-card"
                                                title="Carte de membre"
                                                onClick={() => {
                                                    setMembreCarte(membre);
                                                    setCarteOuverte(true);
                                                }}
                                            >
                                                🪪
                                            </button>

                                            <button
                                                className="action-btn action-edit"
                                                title="Modifier"
                                                onClick={() =>
                                                    modifierMembre(membre)
                                                }
                                            >
                                                ✎
                                            </button>

                                            <button
                                                className="action-btn action-delete"
                                                title="Supprimer"
                                                onClick={() =>
                                                    supprimerMembre(membre)
                                                }
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {modalOuvert && (
            <MembreModal
                membre={membreSelectionne}
                provinces={provinces}
                zones={zones}
                coordinations={coordinations}
                fermer={() => {
                    setModalOuvert(false);
                    setMembreSelectionne(null);
                }}
                apresEnregistrement={apresEnregistrement}
            />
        )}

        {carteOuverte && membreCarte && (
            <CarteMembreModal
                membre={membreCarte}
                fermer={() => {
                    setCarteOuverte(false);
                    setMembreCarte(null);
                }}
            />
        )}
    </div>
);

}

/* ============================================================
STRUCTURE
============================================================ */

function StructurePage({ provinces = [], zones = [], coordinations = [] }) {
    const [structureNationale, setStructureNationale] = useState({});
    const [erreurStructure, setErreurStructure] = useState("");

    useEffect(() => {
        let actif = true;
        (async () => {
            try {
                const data = await requeteAPI("/api/foundation/structure", {
                    nePasDeconnecterSi401: true,
                });
                if (actif) setStructureNationale(data?.structure || data || {});
            } catch (error) {
                // La hiérarchie provinces/zones/coordinations reste affichée
                // même si l'endpoint de la structure nationale n'est pas disponible.
                if (actif) setErreurStructure(error?.message || "");
            }
        })();
        return () => { actif = false; };
    }, []);

    const valeurRelation = (objet, ...cles) => {
        for (const cle of cles) {
            if (objet?.[cle] !== undefined && objet?.[cle] !== null && objet[cle] !== "") {
                return String(objet[cle]);
            }
        }
        return "";
    };

    const afficherNom = (objet) => {
        if (typeof objet === "string") return objet;
        return nomReference(objet);
    };

    const direction = structureNationale?.structure || structureNationale?.direction || structureNationale;
    const president = direction?.president || direction?.president_national || direction?.president_nom;
    const secretaire = direction?.secretaire || direction?.secretaire_national || direction?.secretaire_nom;
    const listeCoordinateursNationaux = Array.isArray(direction?.coordinateurs)
        ? direction.coordinateurs
        : Array.isArray(direction?.coordinateurs_nationaux)
            ? direction.coordinateurs_nationaux
            : [];

    return (
        <div className="contenu-page">
            <div className="page-heading">
                <div>
                    <span className="page-kicker">ORGANISATION</span>
                    <h2>Structure F.E.N</h2>
                    <p>Organisation hiérarchique de la Fondation Ézéchiel NTAL.</p>
                </div>
            </div>

            <div className="structure-card">
                <div className="structure-root">
                    <div className="structure-root-icon">F</div>
                    <div>
                        <span>COORDINATION NATIONALE</span>
                        <strong>Fondation Ézéchiel NTAL</strong>
                        {president && <p><b>Président :</b> {afficherNom(president)}</p>}
                        {secretaire && <p><b>Secrétaire :</b> {afficherNom(secretaire)}</p>}
                        {listeCoordinateursNationaux.length > 0 && (
                            <p><b>Coordinateurs nationaux :</b> {listeCoordinateursNationaux.map(afficherNom).join(", ")}</p>
                        )}
                    </div>
                </div>

                {erreurStructure && !president && !secretaire && (
                    <p className="texte-secondaire">Les informations de la direction nationale ne sont pas disponibles. Les provinces et leurs subdivisions restent affichées ci-dessous.</p>
                )}

                <div className="structure-line" />
                <h3>Provinces et subdivisions</h3>
                {provinces.length === 0 ? (
                    <div className="empty-card">
                        Aucune province n'a été chargée. Vérifiez que l'API <code>/api/provinces</code> répond correctement.
                    </div>
                ) : (
                    <div className="reference-grid">
                        {provinces.map((province, index) => {
                            const provinceId = valeurRelation(province, "id", "province_id", "id_province", "code");
                            const zonesProvince = zones.filter((zone) =>
                                valeurRelation(zone, "province_id", "id_province", "provinceId", "province") === provinceId
                            );
                            return (
                                <div className="reference-card" key={provinceId || `province-${index}`}>
                                    <div className="reference-card-icon">◈</div>
                                    <div>
                                        <span>{province.code || "PROVINCE"}</span>
                                        <h3>{afficherNom(province)}</h3>
                                        {province.coordinateur_nom && <p><b>Coordinateur :</b> {province.coordinateur_nom}</p>}
                                        {zonesProvince.length === 0 ? (
                                            <p className="texte-secondaire">Aucune zone associée.</p>
                                        ) : (
                                            <div className="structure-subdivision">
                                                {zonesProvince.map((zone, zoneIndex) => {
                                                    const zoneId = valeurRelation(zone, "id", "zone_id", "id_zone");
                                                    const coordinationsZone = coordinations.filter((coordination) =>
                                                        valeurRelation(coordination, "zone_id", "id_zone", "zoneId", "zone") === zoneId
                                                    );
                                                    return (
                                                        <div className="structure-zone" key={zoneId || `zone-${zoneIndex}`}>
                                                            <strong>◇ {afficherNom(zone)}</strong>
                                                            {coordinationsZone.length > 0 ? (
                                                                <ul>
                                                                    {coordinationsZone.map((coordination, coordinationIndex) => (
                                                                        <li key={valeurRelation(coordination, "id", "coordination_id", "id_coordination") || `coord-${coordinationIndex}`}>
                                                                            {afficherNom(coordination)}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="texte-secondaire">Aucune coordination associée.</p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ============================================================
LISTES : PROVINCES, ZONES ET COORDINATIONS
============================================================ */

function ListeReferencePage({
titre,
sousTitre,
donnees,
type,
}) {
return (
<div className="contenu-page">
<div className="page-heading">
<div>
<span className="page-kicker">ORGANISATION</span>
<h2>{titre}</h2>
<p>{sousTitre}</p>
</div>
</div>

        <div className="reference-grid">
            {donnees.length === 0 ? (
                <div className="empty-card">
                    Aucune donnée enregistrée.
                </div>
            ) : (
                donnees.map((item) => (
                    <div className="reference-card" key={item.id}>
                        <div className="reference-card-icon">
                            {type === "province"
                                ? "◈"
                                : type === "zone"
                                ? "◇"
                                : "◎"}
                        </div>

                        <div>
                            <span>{item.code || type}</span>
                            <h3>{item.nom}</h3>
                            {item.description && (
                                <p>{item.description}</p>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

}

/* ============================================================
   PARAMÈTRES DE LA FONDATION F.E.N
============================================================ */


function ParametresPage() {
    const CLE_PARAMETRES = "fen_parametres";

    const valeursParDefaut = {
        nom: "Fondation Ézéchiel NTAL",
        sigle: "F.E.N ASBL",
        slogan: "Ensemble pour l’espoir, Unis pour le changement",
        telephone: "",
        email: "",
        adresse: "",
        devise: "USD",
        piedPage: "L’Amour • L’Unité • Le Travail",
    };

    const [parametres, setParametres] = useState(() => {
        try {
            const donnees = localStorage.getItem(CLE_PARAMETRES);

            return {
                ...valeursParDefaut,
                ...(donnees ? JSON.parse(donnees) : {}),
            };
        } catch (error) {
            console.error("Erreur de lecture :", error);
            return { ...valeursParDefaut };
        }
    });

    const [message, setMessage] = useState("");
    const [erreur, setErreur] = useState("");

    function modifierChamp(nom, valeur) {
        setParametres((ancien) => ({
            ...ancien,
            [nom]: valeur,
        }));

        setMessage("");
        setErreur("");
    }

    function enregistrerParametres(e) {
        e.preventDefault();

        if (!parametres.nom.trim()) {
            setErreur("Le nom de la fondation est obligatoire.");
            setMessage("");
            return;
        }

        if (!parametres.sigle.trim()) {
            setErreur("Le sigle de la fondation est obligatoire.");
            setMessage("");
            return;
        }

        try {
            localStorage.setItem(
                CLE_PARAMETRES,
                JSON.stringify(parametres)
            );

            setMessage("Les paramètres ont été enregistrés avec succès.");
            setErreur("");
        } catch (error) {
            console.error("Erreur d'enregistrement :", error);
            setErreur("Impossible d'enregistrer les paramètres.");
            setMessage("");
        }
    }

    function restaurerParametres() {
        if (
            !window.confirm(
                "Voulez-vous restaurer les paramètres par défaut ?"
            )
        ) {
            return;
        }

        try {
            const valeurs = { ...valeursParDefaut };

            localStorage.setItem(
                CLE_PARAMETRES,
                JSON.stringify(valeurs)
            );

            setParametres(valeurs);
            setMessage("Les paramètres par défaut ont été restaurés.");
            setErreur("");
        } catch (error) {
            console.error("Erreur de restauration :", error);
            setErreur("Impossible de restaurer les paramètres.");
            setMessage("");
        }
    }

    function champ(label, nom, options = {}) {
        return (
            <div
                className={`champ ${options.classe || ""}`}
                key={nom}
            >
                <label htmlFor={`param-${nom}`}>
                    {label}
                    {options.obligatoire && <em> *</em>}
                </label>

                <input
                    id={`param-${nom}`}
                    type={options.type || "text"}
                    value={parametres[nom] ?? ""}
                    onChange={(e) =>
                        modifierChamp(nom, e.target.value)
                    }
                    placeholder={options.placeholder || label}
                    required={Boolean(options.obligatoire)}
                />
            </div>
        );
    }

    return (
        <div className="page-contenu">
            <div className="page-entete">
                <div>
                    <h2>Paramètres de la fondation</h2>
                    <p>
                        Configurez les informations générales de votre
                        fondation.
                    </p>
                </div>
            </div>

            <form
                onSubmit={enregistrerParametres}
                className="carte-formulaire"
            >
                <h3>Informations générales</h3>

                <div className="grille-formulaire">
                    {champ("Nom de la fondation", "nom", {
                        obligatoire: true,
                    })}

                    {champ("Sigle", "sigle", {
                        obligatoire: true,
                    })}

                    {champ("Slogan", "slogan", {
                        classe: "champ-large",
                    })}

                    {champ("Téléphone", "telephone", {
                        type: "tel",
                    })}

                    {champ("Adresse e-mail", "email", {
                        type: "email",
                    })}

                    {champ("Adresse physique", "adresse", {
                        classe: "champ-large",
                    })}

                    {champ("Devise utilisée", "devise", {
                        obligatoire: true,
                        placeholder: "USD ou CDF",
                    })}

                    {champ("Texte du pied de page", "piedPage", {
                        classe: "champ-large",
                    })}
                </div>

                {message && (
                    <div
                        role="status"
                        style={{
                            marginTop: "18px",
                            padding: "12px",
                            borderRadius: "6px",
                            background: "#e8f7ed",
                            color: "#176534",
                        }}
                    >
                        {message}
                    </div>
                )}

                {erreur && (
                    <div
                        role="alert"
                        style={{
                            marginTop: "18px",
                            padding: "12px",
                            borderRadius: "6px",
                            background: "#fdecec",
                            color: "#a32121",
                        }}
                    >
                        {erreur}
                    </div>
                )}

                <div
                    className="actions-formulaire"
                    style={{
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginTop: "24px",
                    }}
                >
                    <button
                        type="submit"
                        className="bouton-principal"
                    >
                        💾 Enregistrer les paramètres
                    </button>

                    <button
                        type="button"
                        className="bouton-secondaire"
                        onClick={restaurerParametres}
                    >
                        ↻ Restaurer les valeurs par défaut
                    </button>
                </div>
            </form>

            <div
                className="carte-formulaire"
                style={{ marginTop: "24px" }}
            >
                <h3>Aperçu</h3>

                <h2>{parametres.nom}</h2>
                <p><strong>{parametres.sigle}</strong></p>
                <p>{parametres.slogan}</p>

                {parametres.telephone && (
                    <p>Téléphone : {parametres.telephone}</p>
                )}

                {parametres.email && (
                    <p>E-mail : {parametres.email}</p>
                )}

                {parametres.adresse && (
                    <p>Adresse : {parametres.adresse}</p>
                )}

                <p>Devise : {parametres.devise}</p>

                <hr />

                <p>{parametres.piedPage}</p>
            </div>
        </div>
    );
}

/* ============================================================
APPLICATION PRINCIPALE
============================================================ */

export default function App() {
const [utilisateur, setUtilisateur] =
useState(obtenirUtilisateur());

const [page, setPage] = useState("dashboard");
const [membres, setMembres] = useState([]);
const [provinces, setProvinces] = useState([]);
const [zones, setZones] = useState([]);
const [coordinations, setCoordinations] = useState([]);
const [chargement, setChargement] = useState(false);
const [erreur, setErreur] = useState("");
const [sidebarOuverte, setSidebarOuverte] = useState(false);

/*
 * Nouvel état : affiche le formulaire public sans connexion.
 */
const [
    formulairePublicOuvert,
    setFormulairePublicOuvert,
] = useState(false);

/* ========================================================
   SESSION
======================================================== */

useEffect(() => {
    function sessionExpiree() {
        setUtilisateur(null);
        setPage("dashboard");
        setFormulairePublicOuvert(false);
    }

    window.addEventListener(
        "fen-session-expiree",
        sessionExpiree
    );

    return () => {
        window.removeEventListener(
            "fen-session-expiree",
            sessionExpiree
        );
    };
}, []);

useEffect(() => {
    if (utilisateur) {
        chargerDonnees();
    }
}, [utilisateur]);

/* ========================================================
   CHARGEMENT DES DONNÉES
======================================================== */

async function chargerDonnees() {
    try {
        setChargement(true);
        setErreur("");

        const resultats = await Promise.allSettled([
            requeteAPI("/api/members", {
                nePasDeconnecterSi401: true,
            }),
            requeteAPI("/api/provinces", {
                nePasDeconnecterSi401: true,
            }),
            requeteAPI("/api/zones", {
                nePasDeconnecterSi401: true,
            }),
            requeteAPI("/api/coordinations", {
                nePasDeconnecterSi401: true,
            }),
        ]);

        const [
            resultatMembres,
            resultatProvinces,
            resultatZones,
            resultatCoordinations,
        ] = resultats;

        if (resultatMembres.status === "fulfilled") {
            setMembres(extraireListe(resultatMembres.value));
        } else {
            console.error(
                "Erreur chargement membres :",
                resultatMembres.reason
            );
            setMembres([]);
            setErreur(
                resultatMembres.reason?.message ||
                "Impossible de charger les membres."
            );
        }

        if (resultatProvinces.status === "fulfilled") {
            setProvinces(extraireListe(resultatProvinces.value));
        } else {
            console.error(
                "Erreur chargement provinces :",
                resultatProvinces.reason
            );
            setProvinces([]);
        }

        if (resultatZones.status === "fulfilled") {
            setZones(extraireListe(resultatZones.value));
        } else {
            console.error(
                "Erreur chargement zones :",
                resultatZones.reason
            );
            setZones([]);
        }

        if (resultatCoordinations.status === "fulfilled") {
            setCoordinations(
                extraireListe(resultatCoordinations.value)
            );
        } else {
            console.error(
                "Erreur chargement coordinations :",
                resultatCoordinations.reason
            );
            setCoordinations([]);
        }

        resultats.forEach((resultat, index) => {
            if (resultat.status === "rejected") {
                const noms = [
                    "membres",
                    "provinces",
                    "zones",
                    "coordinations",
                ];

                console.error(
                    `Erreur API ${noms[index]} :`,
                    resultat.reason
                );
            }
        });
    } catch (error) {
        console.error(
            "Erreur générale chargement données :",
            error
        );

        setErreur(
            error.message ||
            "Impossible de charger les données."
        );
    } finally {
        setChargement(false);
    }
}

async function actualiserMembres() {
    const data = await requeteAPI("/api/members");
    setMembres(extraireListe(data));
}

function connexionReussie(user) {
    setUtilisateur(user);
    setPage("dashboard");
    setFormulairePublicOuvert(false);
}

function deconnexion() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setUtilisateur(null);
    setPage("dashboard");
    setMembres([]);
    setProvinces([]);
    setZones([]);
    setCoordinations([]);
    setErreur("");
    setFormulairePublicOuvert(false);
}

/*
 * Écran public :
 * aucune connexion n'est requise pour envoyer une demande.
 */
if (!utilisateur) {
    if (formulairePublicOuvert) {
        return (
            <FormulaireAdhesionPublic
                onRetour={() => setFormulairePublicOuvert(false)}
            />
        );
    }

    return (
        <LoginPage
            onConnexion={connexionReussie}
            onDemanderAdhesion={() =>
                setFormulairePublicOuvert(true)
            }
        />
    );
}

/* ========================================================
   AFFICHAGE DES PAGES
======================================================== */

let contenu;

if (chargement && page === "dashboard") {
    contenu = (
        <div className="contenu-page">
            <div className="chargement-page">
                <div className="spinner" />
                Chargement du tableau de bord...
            </div>
        </div>
    );
} else if (page === "dashboard") {
    contenu = (
        <DashboardPage
            membres={membres}
            provinces={provinces}
            zones={zones}
            coordinations={coordinations}
            utilisateur={utilisateur}
        />
    );
} else if (page === "membres") {
    contenu = (
        <MembresPage
            membres={membres}
            provinces={provinces}
            zones={zones}
            coordinations={coordinations}
            actualiserMembres={actualiserMembres}
        />
    );
} else if (page === "demandes") {
    contenu = <DemandesAdhesionPage />;
} else if (page === "structure") {
    contenu = (
        <StructurePage
            provinces={provinces}
            zones={zones}
            coordinations={coordinations}
        />
    );
} else if (page === "provinces") {
    contenu = (
        <ListeReferencePage
            titre="Provinces"
            sousTitre="Provinces couvertes par la F.E.N."
            donnees={provinces}
            type="province"
        />
    );
} else if (page === "zones") {
    contenu = (
        <ListeReferencePage
            titre="Zones"
            sousTitre="Zones d'implantation de la F.E.N."
            donnees={zones}
            type="zone"
        />
    );
} else if (page === "coordinations") {
    contenu = (
        <ListeReferencePage
            titre="Coordinations"
            sousTitre="Coordinations de la F.E.N."
            donnees={coordinations}
            type="coordination"
        />
    );
} else if (page === "parametres") {
    contenu = <ParametresPage />;
} else {
    contenu = (
        <DashboardPage
            membres={membres}
            provinces={provinces}
            zones={zones}
            coordinations={coordinations}
            utilisateur={utilisateur}
        />
    );
}

const titres = {
    dashboard: "Tableau de bord",
    membres: "Gestion des membres",
    demandes: "Demandes d’adhésion",
    structure: "Structure de la fondation",
    provinces: "Provinces",
    zones: "Zones",
    coordinations: "Coordinations",
    parametres: "Paramètres de la fondation",
};

return (
    <div className="application">
        <Sidebar
            page={page}
            setPage={setPage}
            utilisateur={utilisateur}
            deconnexion={deconnexion}
            ouverte={sidebarOuverte}
            setOuverte={setSidebarOuverte}
        />

        <main className="contenu-principal">
            <Topbar
                titre={
                    titres[page] ||
                    "Fondation Ézéchiel NTAL"
                }
                utilisateur={utilisateur}
                ouvrirMenu={() => setSidebarOuverte(true)}
            />

            {erreur && page !== "membres" && (
                <div className="contenu-page">
                    <div className="alerte alerte-erreur">
                        {erreur}
                    </div>
                </div>
            )}

            {contenu}
        </main>
    </div>
);

}