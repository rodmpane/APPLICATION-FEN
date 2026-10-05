import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

const TOKEN_KEY = "fen_token";
const USER_KEY = "fen_utilisateur";

function extraireListe(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.membres)) return data.membres;
    if (Array.isArray(data?.members)) return data.members;
    if (Array.isArray(data?.provinces)) return data.provinces;
    if (Array.isArray(data?.zones)) return data.zones;
    if (Array.isArray(data?.coordinations)) return data.coordinations;

    return [];
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

async function requeteAPI(endpoint, options = {}) {
    const token = obtenirToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (response.status === 401) {
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
   LOGIN
============================================================ */

function LoginPage({ onConnexion }) {
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
                        {chargement
                            ? "Connexion..."
                            : "Se connecter"}
                    </button>
                </form>

                <div className="connexion-footer">
                    <strong>F.E.N ASBL</strong>

                    <span>
                        L’Amour • L’Unité • Le Travail
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   SIDEBAR
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
        {
            id: "dashboard",
            label: "Tableau de bord",
            icon: "▦",
        },
        {
            id: "membres",
            label: "Membres",
            icon: "♟",
        },
        {
            id: "structure",
            label: "Structure",
            icon: "⌘",
        },
        {
            id: "provinces",
            label: "Provinces",
            icon: "◈",
        },
        {
            id: "zones",
            label: "Zones",
            icon: "◇",
        },
        {
            id: "coordinations",
            label: "Coordinations",
            icon: "◎",
        },
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

                            <small>
                                {role || "Utilisateur"}
                            </small>
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
   TOPBAR
============================================================ */

function Topbar({
    titre,
    utilisateur,
    ouvrirMenu,
}) {
    return (
        <header className="topbar">
            <button
                className="mobile-menu-button"
                onClick={ouvrirMenu}
            >
                ☰
            </button>

            <div className="topbar-title">
                <h1>{titre}</h1>

                <p>
                    Gestion de la Fondation Ézéchiel NTAL
                </p>
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
   STAT CARD
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
            <div className="stat-card-icon">
                {icon}
            </div>

            <div className="stat-card-content">
                <span>{titre}</span>

                <strong>{valeur}</strong>

                {description && (
                    <small>{description}</small>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   DASHBOARD
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
            String(m.sexe || "").toUpperCase() === "M" ||
            String(m.sexe || "").toUpperCase() === "H"
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
                        Bienvenue{" "}
                        {utilisateur?.nom
                            ? `, ${utilisateur.nom}`
                            : ""}
                    </h2>

                    <p>
                        Gérez les membres, les provinces, les
                        zones et les coordinations de la F.E.N
                        depuis votre tableau de bord.
                    </p>
                </div>

                <div className="bienvenue-decoration">
                    F.E.N
                </div>
            </div>

            <div className="section-heading">
                <div>
                    <h2>Vue générale</h2>

                    <p>
                        Situation actuelle de la fondation
                    </p>
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
                        <div className="repartition-item">
                            <div className="repartition-icon">
                                H
                            </div>

                            <div>
                                <strong>{hommes}</strong>
                                <span>Hommes</span>
                            </div>
                        </div>

                        <div className="repartition-item">
                            <div className="repartition-icon">
                                F
                            </div>

                            <div>
                                <strong>{femmes}</strong>
                                <span>Femmes</span>
                            </div>
                        </div>

                        <div className="repartition-item">
                            <div className="repartition-icon">
                                ∑
                            </div>

                            <div>
                                <strong>
                                    {membres.length}
                                </strong>

                                <span>Total</span>
                            </div>
                        </div>
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
                        <div>
                            <span>01</span>
                            <strong>
                                Coordination nationale
                            </strong>
                        </div>

                        <div>
                            <span>02</span>
                            <strong>
                                {provinces.length} Provinces
                            </strong>
                        </div>

                        <div>
                            <span>03</span>
                            <strong>
                                {zones.length} Zones
                            </strong>
                        </div>

                        <div>
                            <span>04</span>
                            <strong>
                                {coordinations.length} Coordinations
                            </strong>
                        </div>

                        <div>
                            <span>05</span>
                            <strong>
                                {membres.length} Membres
                            </strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   MEMBER MODAL
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
        if (membre) {
            setFormulaire({
                nom: membre.nom || "",
                postnom: membre.postnom || "",
                prenom: membre.prenom || "",
                sexe: membre.sexe || "M",

                date_naissance:
                    membre.date_naissance
                        ? String(
                              membre.date_naissance
                          ).substring(0, 10)
                        : "",

                telephone: membre.telephone || "",

                telephone_secondaire:
                    membre.telephone_secondaire || "",

                email: membre.email || "",
                adresse: membre.adresse || "",
                commune: membre.commune || "",
                ville: membre.ville || "",
                profession: membre.profession || "",
                photo_url: membre.photo_url || "",

                province_id:
                    membre.province_id ||
                    membre.zone_province_id ||
                    "",

                zone_id: membre.zone_id || "",

                coordination_id:
                    membre.coordination_id ||
                    "",

                status_id:
                    Number(membre.status_id) || 1,

                date_adhesion:
                    membre.date_adhesion
                        ? String(
                              membre.date_adhesion
                          ).substring(0, 10)
                        : "",

                date_expiration:
                    membre.date_expiration
                        ? String(
                              membre.date_expiration
                          ).substring(0, 10)
                        : "",

                observations:
                    membre.observations || "",

                actif:
                    membre.actif !== false &&
                    membre.actif !== "false",
            });
        }
    }, [membre]);

    const zonesDisponibles = useMemo(() => {
        if (!formulaire.province_id) return [];

        return zones.filter(
            (zone) =>
                Number(zone.province_id) ===
                Number(formulaire.province_id)
        );
    }, [zones, formulaire.province_id]);

    const coordinationsDisponibles = useMemo(() => {
        if (!formulaire.zone_id) return [];

        return coordinations.filter(
            (coordination) =>
                Number(coordination.zone_id) ===
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
        const provinceId = e.target.value;

        setFormulaire((ancien) => ({
            ...ancien,
            province_id: provinceId,
            zone_id: "",
            coordination_id: "",
        }));
    }

    function changerZone(e) {
        const zoneId = e.target.value;

        setFormulaire((ancien) => ({
            ...ancien,
            zone_id: zoneId,
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

        if (!formulaire.province_id) {
            setErreur(
                "Veuillez sélectionner une province."
            );
            return;
        }

        if (!formulaire.zone_id) {
            setErreur(
                "Veuillez sélectionner une zone."
            );
            return;
        }

        if (!formulaire.coordination_id) {
            setErreur(
                "Veuillez sélectionner une coordination."
            );
            return;
        }

        const zone = zones.find(
            (item) =>
                Number(item.id) ===
                Number(formulaire.zone_id)
        );

        if (
            !zone ||
            Number(zone.province_id) !==
                Number(formulaire.province_id)
        ) {
            setErreur(
                "La zone sélectionnée ne correspond pas à la province."
            );
            return;
        }

        const coordination = coordinations.find(
            (item) =>
                Number(item.id) ===
                Number(formulaire.coordination_id)
        );

        if (
            !coordination ||
            Number(coordination.zone_id) !==
                Number(formulaire.zone_id)
        ) {
            setErreur(
                "La coordination sélectionnée ne correspond pas à la zone."
            );
            return;
        }

        try {
            setChargement(true);

            const payload = {
                nom: formulaire.nom.trim(),

                postnom:
                    formulaire.postnom.trim() || "",

                prenom: formulaire.prenom.trim(),

                sexe: formulaire.sexe || "M",

                date_naissance:
                    formulaire.date_naissance || null,

                telephone:
                    formulaire.telephone.trim() || "",

                telephone_secondaire:
                    formulaire.telephone_secondaire.trim() || "",

                email:
                    formulaire.email.trim() || "",

                adresse:
                    formulaire.adresse.trim() || "",

                commune:
                    formulaire.commune.trim() || "",

                ville:
                    formulaire.ville.trim() || "",

                profession:
                    formulaire.profession.trim() || "",

                photo_url:
                    formulaire.photo_url.trim() || "",

                zone_id:
                    Number(formulaire.zone_id),

                coordination_id:
                    Number(formulaire.coordination_id),

                status_id:
                    Number(formulaire.status_id) || 1,

                date_adhesion:
                    formulaire.date_adhesion || null,

                date_expiration:
                    formulaire.date_expiration || null,

                observations:
                    formulaire.observations.trim() || "",

                actif:
                    Boolean(formulaire.actif),
            };

            let data;

            if (membre?.id) {
                data = await requeteAPI(
                    `/api/members/${membre.id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(payload),
                    }
                );
            } else {
                data = await requeteAPI(
                    "/api/members",
                    {
                        method: "POST",
                        body: JSON.stringify(payload),
                    }
                );
            }

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

    return (
        <div
            className="modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    fermer();
                }
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
                            <div className="champ">
                                <label>
                                    Nom <em>*</em>
                                </label>

                                <input
                                    value={formulaire.nom}
                                    onChange={(e) =>
                                        modifierChamp(
                                            "nom",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nom"
                                />
                            </div>

                            <div className="champ">
                                <label>Postnom</label>

                                <input
                                    value={formulaire.postnom}
                                    onChange={(e) =>
                                        modifierChamp(
                                            "postnom",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Postnom"
                                />
                            </div>

                            <div className="champ">
                                <label>
                                    Prénom <em>*</em>
                                </label>

                                <input
                                    value={formulaire.prenom}
                                    onChange={(e) =>
                                        modifierChamp(
                                            "prenom",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Prénom"
                                />
                            </div>

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
                                    <option value="M">
                                        Masculin
                                    </option>

                                    <option value="F">
                                        Féminin
                                    </option>
                                </select>
                            </div>

                            <div className="champ">
                                <label>
                                    Date de naissance
                                </label>

                                <input
                                    type="date"
                                    value={
                                        formulaire.date_naissance
                                    }
                                    onChange={(e) =>
                                        modifierChamp(
                                            "date_naissance",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <div className="champ">
                                <label>Profession</label>

                                <input
                                    value={
                                        formulaire.profession
                                    }
                                    onChange={(e) =>
                                        modifierChamp(
                                            "profession",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Profession"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <span>02</span>
                            Coordonnées
                        </div>

                        <div className="form-grid-3">
                            <div className="champ">
                                <label>
                                    Téléphone <em>*</em>
                                </label>

                                <input
                                    value={
                                        formulaire.telephone
                                    }
                                    onChange={(e) =>
                                        modifierChamp(
                                            "telephone",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ex. 0820000000"
                                />
                            </div>

                            <div className="champ">
                                <label>
                                    Téléphone secondaire
                                </label>

                                <input
                                    value={
                                        formulaire.telephone_secondaire
                                    }
                                    onChange={(e) =>
                                        modifierChamp(
                                            "telephone_secondaire",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Optionnel"
                                />
                            </div>

                            <div className="champ">
                                <label>Email</label>

                                <input
                                    type="email"
                                    value={formulaire.email}
                                    onChange={(e) =>
                                        modifierChamp(
                                            "email",
                                            e.target.value
                                        )
                                    }
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div className="champ champ-large">
                                <label>Adresse</label>

                                <input
                                    value={formulaire.adresse}
                                    onChange={(e) =>
                                        modifierChamp(
                                            "adresse",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Adresse"
                                />
                            </div>

                            <div className="champ">
                                <label>Commune</label>

                                <input
                                    value={formulaire.commune}
                                    onChange={(e) =>
                                        modifierChamp(
                                            "commune",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Commune"
                                />
                            </div>

                            <div className="champ">
                                <label>Ville</label>

                                <input
                                    value={formulaire.ville}
                                    onChange={(e) =>
                                        modifierChamp(
                                            "ville",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ville"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <span>03</span>
                            Affectation F.E.N
                        </div>

                        <div className="form-grid-3">
                            <div className="champ">
                                <label>
                                    Province <em>*</em>
                                </label>

                                <select
                                    value={
                                        formulaire.province_id
                                    }
                                    onChange={changerProvince}
                                >
                                    <option value="">
                                        Sélectionner une province
                                    </option>

                                    {provinces.map(
                                        (province) => (
                                            <option
                                                key={province.id}
                                                value={province.id}
                                            >
                                                {province.nom}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="champ">
                                <label>
                                    Zone <em>*</em>
                                </label>

                                <select
                                    value={
                                        formulaire.zone_id
                                    }
                                    onChange={changerZone}
                                    disabled={
                                        !formulaire.province_id
                                    }
                                >
                                    <option value="">
                                        {formulaire.province_id
                                            ? "Sélectionner une zone"
                                            : "Choisir d'abord la province"}
                                    </option>

                                    {zonesDisponibles.map(
                                        (zone) => (
                                            <option
                                                key={zone.id}
                                                value={zone.id}
                                            >
                                                {zone.nom}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="champ">
                                <label>
                                    Coordination <em>*</em>
                                </label>

                                <select
                                    value={
                                        formulaire.coordination_id
                                    }
                                    onChange={(e) =>
                                        modifierChamp(
                                            "coordination_id",
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        !formulaire.zone_id
                                    }
                                >
                                    <option value="">
                                        {formulaire.zone_id
                                            ? "Sélectionner une coordination"
                                            : "Choisir d'abord la zone"}
                                    </option>

                                    {coordinationsDisponibles.map(
                                        (coordination) => (
                                            <option
                                                key={
                                                    coordination.id
                                                }
                                                value={
                                                    coordination.id
                                                }
                                            >
                                                {coordination.nom}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="champ">
                                <label>
                                    Statut du membre
                                </label>

                                <select
                                    value={
                                        formulaire.status_id
                                    }
                                    onChange={(e) =>
                                        modifierChamp(
                                            "status_id",
                                            Number(
                                                e.target.value
                                            )
                                        )
                                    }
                                >
                                    <option value={1}>
                                        Actif
                                    </option>

                                    <option value={2}>
                                        Inactif
                                    </option>

                                    <option value={3}>
                                        Suspendu
                                    </option>
                                </select>
                            </div>

                            <div className="champ">
                                <label>
                                    Date d'adhésion
                                </label>

                                <input
                                    type="date"
                                    value={
                                        formulaire.date_adhesion
                                    }
                                    onChange={(e) =>
                                        modifierChamp(
                                            "date_adhesion",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <div className="champ">
                                <label>
                                    Date d'expiration
                                </label>

                                <input
                                    type="date"
                                    value={
                                        formulaire.date_expiration
                                    }
                                    onChange={(e) =>
                                        modifierChamp(
                                            "date_expiration",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="form-section-title">
                            <span>04</span>
                            Informations complémentaires
                        </div>

                        <div className="form-grid-2">
                            <div className="champ">
                                <label>Photo URL</label>

                                <input
                                    value={
                                        formulaire.photo_url
                                    }
                                    onChange={(e) =>
                                        modifierChamp(
                                            "photo_url",
                                            e.target.value
                                        )
                                    }
                                    placeholder="URL de la photo"
                                />
                            </div>

                            <div className="champ champ-checkbox">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={
                                            formulaire.actif
                                        }
                                        onChange={(e) =>
                                            modifierChamp(
                                                "actif",
                                                e.target.checked
                                            )
                                        }
                                    />

                                    <span>
                                        Membre actif
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="champ">
                            <label>Observations</label>

                            <textarea
                                rows="4"
                                value={
                                    formulaire.observations
                                }
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
   CARTE MEMBRE
============================================================ */

function CarteMembreModal({ membre, fermer }) {
    const [carte, setCarte] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");
    const [telechargement, setTelechargement] =
        useState(false);

    useEffect(() => {
        if (membre?.id) {
            chargerCarte();
        }
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
                /*
                 * Si aucune carte active n'existe,
                 * le backend retourne normalement 404.
                 *
                 * requeteAPI conserve maintenant le status
                 * HTTP dans error.status.
                 */
                const aucuneCarte =
                    error?.status === 404 ||
                    String(error?.message || "")
                        .toLowerCase()
                        .includes("aucune carte active");

                if (!aucuneCarte) {
                    throw error;
                }

                const utilisateur =
                    obtenirUtilisateur();

                const role = String(
                    utilisateur?.role ||
                        utilisateur?.role_nom ||
                        utilisateur?.profil ||
                        ""
                )
                    .trim()
                    .toUpperCase();

                /*
                 * Seuls ces profils peuvent générer
                 * une nouvelle carte.
                 */
                if (
                    role !== "ADMIN" &&
                    role !== "SECRETAIRE_GENERAL"
                ) {
                    throw new Error(
                        "Aucune carte active pour ce membre. Seul l'administrateur ou le secrétaire général peut générer une nouvelle carte."
                    );
                }

                /*
                 * Génération automatique de la carte.
                 */
                data = await requeteAPI(
                    `/api/cards/member/${membre.id}/generate`,
                    {
                        method: "POST",
                    }
                );
            }

            setCarte(data);
        } catch (error) {
            console.error(
                "Erreur chargement carte :",
                error
            );

            setErreur(
                error.message ||
                    "Impossible de charger la carte du membre."
            );
        } finally {
            setChargement(false);
        }
    }

    function nomComplet() {
        return [
            membre?.nom,
            membre?.postnom,
            membre?.prenom,
        ]
            .filter(Boolean)
            .join(" ");
    }

    function formaterDate(date) {
        if (!date) return "—";

        const valeur = String(date).substring(
            0,
            10
        );

        const morceaux = valeur.split("-");

        if (morceaux.length !== 3) {
            return valeur;
        }

        return `${morceaux[2]}/${morceaux[1]}/${morceaux[0]}`;
    }

    async function telechargerPDF() {
        try {
            setTelechargement(true);
            setErreur("");

            const token = obtenirToken();

            const response = await fetch(
                `${API_URL}/api/cards/member/${membre.id}/pdf`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                let message =
                    `Erreur HTTP ${response.status}`;

                try {
                    const data =
                        await response.json();

                    message =
                        data?.message ||
                        data?.error ||
                        message;
                } catch {}

                throw new Error(message);
            }

            const blob =
                await response.blob();

            const url =
                window.URL.createObjectURL(
                    blob
                );

            const lien =
                document.createElement("a");

            lien.href = url;

            lien.download =
                carte?.carte?.numero_carte ||
                `carte-membre-${membre.id}`;

            if (
                !lien.download.endsWith(
                    ".pdf"
                )
            ) {
                lien.download += ".pdf";
            }

            document.body.appendChild(lien);

            lien.click();

            lien.remove();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(
                "Erreur téléchargement PDF :",
                error
            );

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

            const token = obtenirToken();

            const response = await fetch(
                `${API_URL}/api/cards/member/${membre.id}/pdf`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                let message =
                    `Erreur HTTP ${response.status}`;

                try {
                    const data =
                        await response.json();

                    message =
                        data?.message ||
                        data?.error ||
                        message;
                } catch {}

                throw new Error(message);
            }

            const blob =
                await response.blob();

            const url =
                window.URL.createObjectURL(
                    blob
                );

            const fenetre =
                window.open(
                    url,
                    "_blank"
                );

            if (!fenetre) {
                throw new Error(
                    "La fenêtre d'impression a été bloquée par le navigateur."
                );
            }

            fenetre.onload = () => {
                fenetre.focus();
                fenetre.print();
            };
        } catch (error) {
            console.error(
                "Erreur impression carte :",
                error
            );

            setErreur(
                error.message ||
                    "Impossible d'imprimer la carte."
            );
        }
    }

    const informations =
        carte?.membre || membre;

    const donneesCarte =
        carte?.carte;

    return (
        <div
            className="modal-overlay"
            onMouseDown={(e) => {
                if (
                    e.target ===
                    e.currentTarget
                ) {
                    fermer();
                }
            }}
        >
            <div className="modal modal-grand carte-modal">
                <div className="modal-header">
                    <div>
                        <span className="modal-kicker">
                            CARTE DE MEMBRE
                        </span>

                        <h2>
                            Carte de membre F.E.N
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

                {chargement ? (
                    <div className="chargement-page">
                        <div className="spinner" />
                        Chargement de la carte...
                    </div>
                ) : carte ? (
                    <>
                        <div className="carte-preview">
                            <div className="carte-entete">
                                <div className="carte-logo">
                                    F.E.N
                                </div>

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
                                            src={
                                                informations.photo_url
                                            }
                                            alt={
                                                nomComplet()
                                            }
                                            className="carte-photo"
                                        />
                                    ) : (
                                        <div className="carte-photo-placeholder">
                                            {(
                                                informations?.nom ||
                                                "M"
                                            )
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className="carte-informations">
                                    <div className="carte-nom">
                                        {nomComplet()}
                                    </div>

                                    <div className="carte-ligne">
                                        <span>
                                            Matricule
                                        </span>

                                        <strong>
                                            {informations?.matricule ||
                                                "—"}
                                        </strong>
                                    </div>

                                    <div className="carte-ligne">
                                        <span>
                                            Téléphone
                                        </span>

                                        <strong>
                                            {informations?.telephone ||
                                                "—"}
                                        </strong>
                                    </div>

                                    <div className="carte-ligne">
                                        <span>
                                            Province
                                        </span>

                                        <strong>
                                            {informations?.province_nom ||
                                                "—"}
                                        </strong>
                                    </div>

                                    <div className="carte-ligne">
                                        <span>
                                            Zone
                                        </span>

                                        <strong>
                                            {informations?.zone_nom ||
                                                "—"}
                                        </strong>
                                    </div>

                                    <div className="carte-ligne">
                                        <span>
                                            Coordination
                                        </span>

                                        <strong>
                                            {informations?.coordination_nom ||
                                                "—"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="carte-qr-container">
                                    {carte.qrDataUrl ? (
                                        <img
                                            src={
                                                carte.qrDataUrl
                                            }
                                            alt="QR Code"
                                            className="carte-qr"
                                        />
                                    ) : (
                                        <div className="carte-qr-placeholder">
                                            QR
                                        </div>
                                    )}

                                    <span>
                                        Scanner pour vérifier
                                    </span>
                                </div>
                            </div>

                            <div className="carte-pied">
                                <div>
                                    <span>
                                        Numéro de carte
                                    </span>

                                    <strong>
                                        {donneesCarte?.numero_carte ||
                                            "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Expiration
                                    </span>

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
   MEMBRES PAGE
============================================================ */

function MembresPage({
    membres,
    provinces,
    zones,
    coordinations,
    actualiserMembres,
}) {
    const [recherche, setRecherche] =
        useState("");

    const [provinceFiltre, setProvinceFiltre] =
        useState("");

    const [zoneFiltre, setZoneFiltre] =
        useState("");

    const [coordinationFiltre, setCoordinationFiltre] =
        useState("");

    const [modalOuvert, setModalOuvert] =
        useState(false);

    const [membreSelectionne, setMembreSelectionne] =
        useState(null);

    const [carteOuverte, setCarteOuverte] =
        useState(false);

    const [membreCarte, setMembreCarte] =
        useState(null);

    const [erreur, setErreur] =
        useState("");

    const zonesFiltre = useMemo(() => {
        if (!provinceFiltre) return zones;

        return zones.filter(
            (zone) =>
                Number(zone.province_id) ===
                Number(provinceFiltre)
        );
    }, [zones, provinceFiltre]);

    const coordinationsFiltre = useMemo(() => {
        if (!zoneFiltre) return coordinations;

        return coordinations.filter(
            (coordination) =>
                Number(coordination.zone_id) ===
                Number(zoneFiltre)
        );
    }, [coordinations, zoneFiltre]);

    const membresFiltres = useMemo(() => {
        const texte =
            recherche.trim().toLowerCase();

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

            const correspondProvince =
                !provinceFiltre ||
                Number(membre.province_id) ===
                    Number(provinceFiltre);

            const correspondZone =
                !zoneFiltre ||
                Number(membre.zone_id) ===
                    Number(zoneFiltre);

            const correspondCoordination =
                !coordinationFiltre ||
                Number(membre.coordination_id) ===
                    Number(coordinationFiltre);

            return (
                correspondRecherche &&
                correspondProvince &&
                correspondZone &&
                correspondCoordination
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
        const confirmation =
            window.confirm(
                `Voulez-vous vraiment supprimer le membre ${membre.nom || ""} ${membre.prenom || ""} ?`
            );

        if (!confirmation) return;

        try {
            setErreur("");

            await requeteAPI(
                `/api/members/${membre.id}`,
                {
                    method: "DELETE",
                }
            );

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
        const id =
            Number(membre.status_id);

        if (id === 1) return "Actif";
        if (id === 2) return "Inactif";
        if (id === 3) return "Suspendu";

        return "—";
    }

    return (
        <div className="contenu-page">
            <div className="page-heading">
                <div>
                    <span className="page-kicker">
                        GESTION
                    </span>

                    <h2>Membres</h2>

                    <p>
                        Gérez les membres de la Fondation
                        Ézéchiel NTAL.
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
                        onChange={(e) =>
                            setRecherche(
                                e.target.value
                            )
                        }
                        placeholder="Nom, matricule, téléphone..."
                    />
                </div>

                <div className="champ">
                    <label>Province</label>

                    <select
                        value={provinceFiltre}
                        onChange={(e) => {
                            setProvinceFiltre(
                                e.target.value
                            );

                            setZoneFiltre("");

                            setCoordinationFiltre("");
                        }}
                    >
                        <option value="">
                            Toutes les provinces
                        </option>

                        {provinces.map(
                            (province) => (
                                <option
                                    key={province.id}
                                    value={province.id}
                                >
                                    {province.nom}
                                </option>
                            )
                        )}
                    </select>
                </div>

                <div className="champ">
                    <label>Zone</label>

                    <select
                        value={zoneFiltre}
                        onChange={(e) => {
                            setZoneFiltre(
                                e.target.value
                            );

                            setCoordinationFiltre("");
                        }}
                    >
                        <option value="">
                            Toutes les zones
                        </option>

                        {zonesFiltre.map(
                            (zone) => (
                                <option
                                    key={zone.id}
                                    value={zone.id}
                                >
                                    {zone.nom}
                                </option>
                            )
                        )}
                    </select>
                </div>

                <div className="champ">
                    <label>Coordination</label>

                    <select
                        value={
                            coordinationFiltre
                        }
                        onChange={(e) =>
                            setCoordinationFiltre(
                                e.target.value
                            )
                        }
                    >
                        <option value="">
                            Toutes les coordinations
                        </option>

                        {coordinationsFiltre.map(
                            (coordination) => (
                                <option
                                    key={
                                        coordination.id
                                    }
                                    value={
                                        coordination.id
                                    }
                                >
                                    {coordination.nom}
                                </option>
                            )
                        )}
                    </select>
                </div>
            </div>

            <div className="table-card">
                <div className="table-card-header">
                    <div>
                        <h3>
                            Liste des membres
                        </h3>

                        <span>
                            {membresFiltres.length} membre
                            {membresFiltres.length >
                            1
                                ? "s"
                                : ""}
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
                            {membresFiltres.length ===
                            0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="table-empty"
                                    >
                                        Aucun membre trouvé.
                                    </td>
                                </tr>
                            ) : (
                                membresFiltres.map(
                                    (membre) => (
                                        <tr
                                            key={
                                                membre.id
                                            }
                                        >
                                            <td>
                                                <span className="matricule">
                                                    {
                                                        membre.matricule
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="membre-cell">
                                                    <div className="membre-avatar">
                                                        {(
                                                            membre.nom ||
                                                            "M"
                                                        )
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {membre.nom ||
                                                                ""}

                                                            {membre.postnom
                                                                ? ` ${membre.postnom}`
                                                                : ""}
                                                        </strong>

                                                        <span>
                                                            {membre.prenom ||
                                                                ""}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                {membre.telephone ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {membre.province_nom ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {membre.zone_nom ||
                                                    "—"}
                                            </td>

                                            <td>
                                                {membre.coordination_nom ||
                                                    "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={`badge ${
                                                        Number(
                                                            membre.status_id
                                                        ) ===
                                                        1
                                                            ? "badge-actif"
                                                            : Number(
                                                                  membre.status_id
                                                              ) ===
                                                              2
                                                            ? "badge-inactif"
                                                            : "badge-suspendu"
                                                    }`}
                                                >
                                                    {nomStatut(
                                                        membre
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="actions-cell">
                                                    <button
                                                        className="action-btn action-card"
                                                        title="Carte de membre"
                                                        onClick={() => {
                                                            setMembreCarte(
                                                                membre
                                                            );

                                                            setCarteOuverte(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        🪪
                                                    </button>

                                                    <button
                                                        className="action-btn action-edit"
                                                        title="Modifier"
                                                        onClick={() =>
                                                            modifierMembre(
                                                                membre
                                                            )
                                                        }
                                                    >
                                                        ✎
                                                    </button>

                                                    <button
                                                        className="action-btn action-delete"
                                                        title="Supprimer"
                                                        onClick={() =>
                                                            supprimerMembre(
                                                                membre
                                                            )
                                                        }
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOuvert && (
                <MembreModal
                    membre={
                        membreSelectionne
                    }
                    provinces={provinces}
                    zones={zones}
                    coordinations={
                        coordinations
                    }
                    fermer={() => {
                        setModalOuvert(false);
                        setMembreSelectionne(
                            null
                        );
                    }}
                    apresEnregistrement={
                        apresEnregistrement
                    }
                />
            )}

            {carteOuverte &&
                membreCarte && (
                    <CarteMembreModal
                        membre={membreCarte}
                        fermer={() => {
                            setCarteOuverte(
                                false
                            );

                            setMembreCarte(
                                null
                            );
                        }}
                    />
                )}
        </div>
    );
}

/* ============================================================
   STRUCTURE PAGE
============================================================ */

function StructurePage() {
    const [structure, setStructure] =
        useState(null);

    const [chargement, setChargement] =
        useState(true);

    const [erreur, setErreur] =
        useState("");

    useEffect(() => {
        chargerStructure();
    }, []);

    async function chargerStructure() {
        try {
            setChargement(true);

            const data =
                await requeteAPI(
                    "/api/foundation/structure"
                );

            setStructure(data);
        } catch (error) {
            setErreur(
                error.message ||
                    "Impossible de charger la structure."
            );
        } finally {
            setChargement(false);
        }
    }

    if (chargement) {
        return (
            <div className="contenu-page">
                <div className="chargement-page">
                    Chargement de la structure...
                </div>
            </div>
        );
    }

    if (erreur) {
        return (
            <div className="contenu-page">
                <div className="alerte alerte-erreur">
                    {erreur}
                </div>
            </div>
        );
    }

    const donnees =
        structure?.structure ||
        structure ||
        {};

    return (
        <div className="contenu-page">
            <div className="page-heading">
                <div>
                    <span className="page-kicker">
                        ORGANISATION
                    </span>

                    <h2>
                        Structure F.E.N
                    </h2>

                    <p>
                        Organisation hiérarchique de la
                        Fondation Ézéchiel NTAL.
                    </p>
                </div>
            </div>

            <div className="structure-card">
                <div className="structure-root">
                    <div className="structure-root-icon">
                        F
                    </div>

                    <div>
                        <span>FONDATION</span>

                        <strong>
                            Fondation Ézéchiel NTAL
                        </strong>
                    </div>
                </div>

                <div className="structure-line" />

                <pre className="structure-json">
                    {JSON.stringify(
                        donnees,
                        null,
                        2
                    )}
                </pre>
            </div>
        </div>
    );
}

/* ============================================================
   LISTE GENERIQUE
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
                    <span className="page-kicker">
                        ORGANISATION
                    </span>

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
                        <div
                            className="reference-card"
                            key={item.id}
                        >
                            <div className="reference-card-icon">
                                {type ===
                                "province"
                                    ? "◈"
                                    : type === "zone"
                                    ? "◇"
                                    : "◎"}
                            </div>

                            <div>
                                <span>
                                    {item.code ||
                                        type}
                                </span>

                                <h3>
                                    {item.nom}
                                </h3>

                                {item.description && (
                                    <p>
                                        {
                                            item.description
                                        }
                                    </p>
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
   APPLICATION
============================================================ */

export default function App() {
    const [utilisateur, setUtilisateur] =
        useState(obtenirUtilisateur());

    const [page, setPage] =
        useState("dashboard");

    const [membres, setMembres] =
        useState([]);

    const [provinces, setProvinces] =
        useState([]);

    const [zones, setZones] =
        useState([]);

    const [coordinations, setCoordinations] =
        useState([]);

    const [chargement, setChargement] =
        useState(false);

    const [erreur, setErreur] =
        useState("");

    const [sidebarOuverte, setSidebarOuverte] =
        useState(false);

    useEffect(() => {
        function sessionExpiree() {
            setUtilisateur(null);
            setPage("dashboard");
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

    /* ============================================================
       CHARGEMENT DES DONNÉES
       IMPORTANT : Promise.allSettled permet de charger
       chaque liste indépendamment.
    ============================================================ */

    async function chargerDonnees() {
        try {
            setChargement(true);
            setErreur("");

            const resultats = await Promise.allSettled([
                requeteAPI("/api/members"),
                requeteAPI("/api/provinces"),
                requeteAPI("/api/zones"),
                requeteAPI("/api/coordinations"),
            ]);

            const [
                resultatMembres,
                resultatProvinces,
                resultatZones,
                resultatCoordinations,
            ] = resultats;

            /* ====================================================
               MEMBRES
            ==================================================== */

            if (
                resultatMembres.status ===
                "fulfilled"
            ) {
                setMembres(
                    extraireListe(
                        resultatMembres.value
                    )
                );
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

            /* ====================================================
               PROVINCES
            ==================================================== */

            if (
                resultatProvinces.status ===
                "fulfilled"
            ) {
                setProvinces(
                    extraireListe(
                        resultatProvinces.value
                    )
                );
            } else {
                console.error(
                    "Erreur chargement provinces :",
                    resultatProvinces.reason
                );

                setProvinces([]);
            }

            /* ====================================================
               ZONES
            ==================================================== */

            if (
                resultatZones.status ===
                "fulfilled"
            ) {
                setZones(
                    extraireListe(
                        resultatZones.value
                    )
                );
            } else {
                console.error(
                    "Erreur chargement zones :",
                    resultatZones.reason
                );

                setZones([]);
            }

            /* ====================================================
               COORDINATIONS
            ==================================================== */

            if (
                resultatCoordinations.status ===
                "fulfilled"
            ) {
                setCoordinations(
                    extraireListe(
                        resultatCoordinations.value
                    )
                );
            } else {
                console.error(
                    "Erreur chargement coordinations :",
                    resultatCoordinations.reason
                );

                setCoordinations([]);
            }

            /* ====================================================
               AFFICHAGE DES ERREURS DANS LA CONSOLE
            ==================================================== */

            resultats.forEach(
                (resultat, index) => {
                    if (
                        resultat.status ===
                        "rejected"
                    ) {
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
                }
            );
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
        const data =
            await requeteAPI(
                "/api/members"
            );

        setMembres(
            extraireListe(data)
        );
    }

    function connexionReussie(user) {
        setUtilisateur(user);
        setPage("dashboard");
    }

    function deconnexion() {
        localStorage.removeItem(
            TOKEN_KEY
        );

        localStorage.removeItem(
            USER_KEY
        );

        setUtilisateur(null);
        setMembres([]);
        setProvinces([]);
        setZones([]);
        setCoordinations([]);
    }

    if (!utilisateur) {
        return (
            <LoginPage
                onConnexion={
                    connexionReussie
                }
            />
        );
    }

    let contenu;

    if (
        chargement &&
        page === "dashboard"
    ) {
        contenu = (
            <div className="contenu-page">
                <div className="chargement-page">
                    <div className="spinner" />

                    Chargement du tableau de bord...
                </div>
            </div>
        );
    } else if (
        page === "dashboard"
    ) {
        contenu = (
            <DashboardPage
                membres={membres}
                provinces={provinces}
                zones={zones}
                coordinations={
                    coordinations
                }
                utilisateur={
                    utilisateur
                }
            />
        );
    } else if (
        page === "membres"
    ) {
        contenu = (
            <MembresPage
                membres={membres}
                provinces={provinces}
                zones={zones}
                coordinations={
                    coordinations
                }
                actualiserMembres={
                    actualiserMembres
                }
            />
        );
    } else if (
        page === "structure"
    ) {
        contenu = (
            <StructurePage />
        );
    } else if (
        page === "provinces"
    ) {
        contenu = (
            <ListeReferencePage
                titre="Provinces"
                sousTitre="Provinces couvertes par la F.E.N."
                donnees={provinces}
                type="province"
            />
        );
    } else if (
        page === "zones"
    ) {
        contenu = (
            <ListeReferencePage
                titre="Zones"
                sousTitre="Zones d'implantation de la F.E.N."
                donnees={zones}
                type="zone"
            />
        );
    } else if (
        page === "coordinations"
    ) {
        contenu = (
            <ListeReferencePage
                titre="Coordinations"
                sousTitre="Coordinations de la F.E.N."
                donnees={
                    coordinations
                }
                type="coordination"
            />
        );
    } else {
        contenu = (
            <DashboardPage
                membres={membres}
                provinces={provinces}
                zones={zones}
                coordinations={
                    coordinations
                }
                utilisateur={
                    utilisateur
                }
            />
        );
    }

    const titres = {
        dashboard:
            "Tableau de bord",

        membres:
            "Gestion des membres",

        structure:
            "Structure de la fondation",

        provinces:
            "Provinces",

        zones:
            "Zones",

        coordinations:
            "Coordinations",
    };

    return (
        <div className="application">
            <Sidebar
                page={page}
                setPage={setPage}
                utilisateur={
                    utilisateur
                }
                deconnexion={
                    deconnexion
                }
                ouverte={
                    sidebarOuverte
                }
                setOuverte={
                    setSidebarOuverte
                }
            />

            <main className="contenu-principal">
                <Topbar
                    titre={
                        titres[page] ||
                        "Fondation Ézéchiel NTAL"
                    }
                    utilisateur={
                        utilisateur
                    }
                    ouvrirMenu={() =>
                        setSidebarOuverte(
                            true
                        )
                    }
                />

                {erreur &&
                    page !==
                        "membres" && (
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