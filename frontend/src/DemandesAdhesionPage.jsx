import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const styles = {
    page: {
        padding: 24,
        color: "#1e293b",
        fontFamily: "inherit",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 24,
    },
    title: {
        margin: 0,
        fontSize: 25,
        fontWeight: 700,
    },
    subtitle: {
        color: "#64748b",
        fontSize: 14,
        marginTop: 8,
    },
    button: {
        border: 0,
        borderRadius: 8,
        padding: "10px 14px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 13,
    },
    card: {
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 20,
    },
    stats: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
        gap: 16,
        marginBottom: 20,
    },
    controls: {
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 18,
    },
    input: {
        flex: 1,
        minWidth: 190,
        padding: 11,
        border: "1px solid #cbd5e1",
        borderRadius: 8,
        fontSize: 14,
        background: "#fff",
        color: "#1e293b",
    },
    tableWrap: {
        width: "100%",
        overflowX: "auto",
    },
    table: {
        width: "100%",
        minWidth: 850,
        borderCollapse: "collapse",
        fontSize: 13,
    },
    cell: {
        padding: "13px 12px",
        borderBottom: "1px solid #e2e8f0",
        textAlign: "left",
        verticalAlign: "middle",
    },
    alert: {
        padding: 14,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14,
    },
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 18,
    },
    modal: {
        background: "#fff",
        borderRadius: 14,
        width: "100%",
        maxWidth: 720,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: 24,
        boxSizing: "border-box",
    },
};

async function api(endpoint, options = {}) {
    const token = localStorage.getItem("fen_token");

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

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.erreur ||
            `Erreur HTTP ${response.status}`
        );
    }

    return data;
}

function texte(value) {
    return value === null || value === undefined || value === ""
        ? "Non renseigné"
        : String(value);
}

function nomComplet(demande) {
    return [
        demande.nom,
        demande.postnom,
        demande.prenom,
    ]
        .filter(Boolean)
        .join(" ");
}

function dateFr(value) {
    if (!value) return "Non renseignée";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString("fr-FR");
}

function BadgeStatut({ statut }) {
    const config = {
        en_attente: {
            label: "En attente",
            color: "#92400e",
            background: "#fef3c7",
        },
        approuvee: {
            label: "Approuvée",
            color: "#166534",
            background: "#dcfce7",
        },
        rejetee: {
            label: "Rejetée",
            color: "#991b1b",
            background: "#fee2e2",
        },
    };

    const item = config[statut] || {
        label: texte(statut),
        color: "#334155",
        background: "#e2e8f0",
    };

    return (
        <span
            style={{
                display: "inline-block",
                padding: "6px 10px",
                borderRadius: 20,
                color: item.color,
                background: item.background,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
            }}
        >
            {item.label}
        </span>
    );
}

function Detail({ titre, valeur }) {
    return (
        <div
            style={{
                padding: 12,
                background: "#f8fafc",
                borderRadius: 8,
                overflowWrap: "anywhere",
            }}
        >
            <div
                style={{
                    fontSize: 12,
                    color: "#64748b",
                    marginBottom: 6,
                }}
            >
                {titre}
            </div>

            <div style={{ fontWeight: 600, fontSize: 14 }}>
                {texte(valeur)}
            </div>
        </div>
    );
}

export default function DemandesAdhesionPage() {
    const [demandes, setDemandes] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");
    const [recherche, setRecherche] = useState("");
    const [filtre, setFiltre] = useState("tous");
    const [selection, setSelection] = useState(null);
    const [chargementDetails, setChargementDetails] = useState(false);
    const [traitementId, setTraitementId] = useState(null);

    const chargerDemandes = useCallback(async () => {
        setChargement(true);
        setErreur("");

        try {
            const data = await api("/api/membership-requests");

            setDemandes(
                Array.isArray(data.demandes)
                    ? data.demandes
                    : Array.isArray(data.data)
                      ? data.data
                      : Array.isArray(data)
                        ? data
                        : []
            );
        } catch (error) {
            setErreur(error.message);
        } finally {
            setChargement(false);
        }
    }, []);

    useEffect(() => {
        chargerDemandes();
    }, [chargerDemandes]);

    const statistiques = useMemo(
        () => ({
            total: demandes.length,
            attente: demandes.filter(
                (d) => d.statut === "en_attente"
            ).length,
            approuvees: demandes.filter(
                (d) => d.statut === "approuvee"
            ).length,
            rejetees: demandes.filter(
                (d) => d.statut === "rejetee"
            ).length,
        }),
        [demandes]
    );

    const demandesFiltrees = useMemo(() => {
        const terme = recherche.trim().toLowerCase();

        return demandes.filter((d) => {
            const bonStatut =
                filtre === "tous" || d.statut === filtre;

            const contenu = [
                d.nom,
                d.postnom,
                d.prenom,
                d.telephone,
                d.telephone_secondaire,
                d.email,
                d.zone_nom,
                d.coordination_nom,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return bonStatut && (!terme || contenu.includes(terme));
        });
    }, [demandes, recherche, filtre]);

    async function consulter(id) {
        setErreur("");
        setMessage("");
        setChargementDetails(true);

        try {
            const data = await api(
                `/api/membership-requests/${id}`
            );

            if (!data.demande) {
                throw new Error("Les détails de la demande sont indisponibles.");
            }

            setSelection(data.demande);
        } catch (error) {
            setErreur(error.message);
        } finally {
            setChargementDetails(false);
        }
    }

    async function approuver(demande) {
        if (
            !window.confirm(
                `Approuver la demande de ${nomComplet(demande)} ?\n\n` +
                "Un nouveau membre sera créé dans la base de données."
            )
        ) {
            return;
        }

        setTraitementId(demande.id);
        setErreur("");
        setMessage("");

        try {
            const data = await api(
                `/api/membership-requests/${demande.id}/approuver`,
                {
                    method: "PATCH",
                    body: JSON.stringify({}),
                }
            );

            setMessage(
                data.message || "Demande approuvée avec succès."
            );

            setSelection(null);
            await chargerDemandes();

            window.dispatchEvent(
                new Event("fen-membres-actualisation")
            );
        } catch (error) {
            setErreur(error.message);
        } finally {
            setTraitementId(null);
        }
    }

    async function rejeter(demande) {
        const motif = window.prompt(
            `Motif du rejet de la demande de ${nomComplet(demande)} :`
        );

        if (motif === null) return;

        if (!motif.trim()) {
            setErreur("Le motif du rejet est obligatoire.");
            return;
        }

        if (!window.confirm("Confirmer le rejet de cette demande ?")) {
            return;
        }

        setTraitementId(demande.id);
        setErreur("");
        setMessage("");

        try {
            const data = await api(
                `/api/membership-requests/${demande.id}/rejeter`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        motif_rejet: motif.trim(),
                    }),
                }
            );

            setMessage(data.message || "Demande rejetée.");
            setSelection(null);

            await chargerDemandes();
        } catch (error) {
            setErreur(error.message);
        } finally {
            setTraitementId(null);
        }
    }

    const cartes = [
        {
            label: "Total des demandes",
            value: statistiques.total,
            color: "#1d4ed8",
            background: "#eff6ff",
        },
        {
            label: "En attente",
            value: statistiques.attente,
            color: "#b45309",
            background: "#fffbeb",
        },
        {
            label: "Approuvées",
            value: statistiques.approuvees,
            color: "#15803d",
            background: "#f0fdf4",
        },
        {
            label: "Rejetées",
            value: statistiques.rejetees,
            color: "#b91c1c",
            background: "#fef2f2",
        },
    ];

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>
                        Demandes d'adhésion
                    </h1>

                    <p style={styles.subtitle}>
                        Fondation Ézéchiel NTAL — Gestion des candidatures
                    </p>
                </div>

                <button
                    type="button"
                    onClick={chargerDemandes}
                    disabled={chargement}
                    style={{
                        ...styles.button,
                        background: "#1d4ed8",
                        color: "#fff",
                    }}
                >
                    {chargement ? "Chargement..." : "↻ Actualiser"}
                </button>
            </div>

            {erreur && (
                <div
                    role="alert"
                    style={{
                        ...styles.alert,
                        background: "#fee2e2",
                        color: "#991b1b",
                    }}
                >
                    <strong>Erreur :</strong> {erreur}
                </div>
            )}

            {message && (
                <div
                    role="status"
                    style={{
                        ...styles.alert,
                        background: "#dcfce7",
                        color: "#166534",
                    }}
                >
                    {message}
                </div>
            )}

            <div style={styles.stats}>
                {cartes.map((carte) => (
                    <div
                        key={carte.label}
                        style={{
                            ...styles.card,
                            background: carte.background,
                        }}
                    >
                        <div style={{ color: "#64748b", fontSize: 13 }}>
                            {carte.label}
                        </div>

                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: 700,
                                color: carte.color,
                                marginTop: 8,
                            }}
                        >
                            {carte.value}
                        </div>
                    </div>
                ))}
            </div>

            <div style={styles.card}>
                <div style={styles.controls}>
                    <input
                        type="search"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder="Rechercher un nom, téléphone ou email..."
                        aria-label="Rechercher une demande"
                        style={styles.input}
                    />

                    <select
                        value={filtre}
                        onChange={(e) => setFiltre(e.target.value)}
                        aria-label="Filtrer par statut"
                        style={styles.input}
                    >
                        <option value="tous">Tous les statuts</option>
                        <option value="en_attente">En attente</option>
                        <option value="approuvee">Approuvées</option>
                        <option value="rejetee">Rejetées</option>
                    </select>
                </div>

                <p style={{ color: "#64748b", fontSize: 13 }}>
                    {demandesFiltrees.length} demande(s) affichée(s)
                </p>

                {chargement ? (
                    <p>Chargement des demandes...</p>
                ) : (
                    <div style={styles.tableWrap}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={{ background: "#f8fafc" }}>
                                    {[
                                        "Candidat",
                                        "Téléphone",
                                        "Zone",
                                        "Coordination",
                                        "Date",
                                        "Statut",
                                        "Actions",
                                    ].map((titre) => (
                                        <th key={titre} style={styles.cell}>
                                            {titre}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {demandesFiltrees.map((demande) => (
                                    <tr key={demande.id}>
                                        <td style={styles.cell}>
                                            <strong>
                                                {nomComplet(demande) || "Sans nom"}
                                            </strong>
                                        </td>

                                        <td style={styles.cell}>
                                            {texte(demande.telephone)}
                                        </td>

                                        <td style={styles.cell}>
                                            {texte(demande.zone_nom)}
                                        </td>

                                        <td style={styles.cell}>
                                            {texte(demande.coordination_nom)}
                                        </td>

                                        <td style={styles.cell}>
                                            {dateFr(demande.date_creation)}
                                        </td>

                                        <td style={styles.cell}>
                                            <BadgeStatut statut={demande.statut} />
                                        </td>

                                        <td style={styles.cell}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 6,
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    style={{
                                                        ...styles.button,
                                                        background: "#e0f2fe",
                                                        color: "#075985",
                                                    }}
                                                    onClick={() => consulter(demande.id)}
                                                >
                                                    Détails
                                                </button>

                                                {demande.statut === "en_attente" && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={traitementId === demande.id}
                                                            style={{
                                                                ...styles.button,
                                                                background: "#dcfce7",
                                                                color: "#166534",
                                                            }}
                                                            onClick={() => approuver(demande)}
                                                        >
                                                            Approuver
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={traitementId === demande.id}
                                                            style={{
                                                                ...styles.button,
                                                                background: "#fee2e2",
                                                                color: "#991b1b",
                                                            }}
                                                            onClick={() => rejeter(demande)}
                                                        >
                                                            Rejeter
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {demandesFiltrees.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            style={{
                                                ...styles.cell,
                                                textAlign: "center",
                                                padding: 35,
                                                color: "#64748b",
                                            }}
                                        >
                                            {demandes.length === 0
                                                ? "Aucune demande enregistrée."
                                                : "Aucune demande ne correspond à la recherche."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {chargementDetails && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        Chargement des détails...
                    </div>
                </div>
            )}

            {selection && (
                <div
                    style={styles.overlay}
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelection(null);
                        }
                    }}
                >
                    <div
                        style={styles.modal}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div>
                                <h2 style={{ margin: 0 }}>
                                    Détails du candidat
                                </h2>

                                <p style={{ color: "#64748b", fontSize: 13 }}>
                                    Demande n° {selection.id}
                                </p>
                            </div>

                            <button
                                type="button"
                                style={{
                                    ...styles.button,
                                    background: "#f1f5f9",
                                    color: "#334155",
                                }}
                                onClick={() => setSelection(null)}
                            >
                                Fermer
                            </button>
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <BadgeStatut statut={selection.statut} />
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: 12,
                                marginTop: 20,
                            }}
                        >
                            <Detail titre="Nom" valeur={selection.nom} />
                            <Detail titre="Postnom" valeur={selection.postnom} />
                            <Detail titre="Prénom" valeur={selection.prenom} />
                            <Detail titre="Sexe" valeur={selection.sexe} />
                            <Detail
                                titre="Date de naissance"
                                valeur={dateFr(selection.date_naissance)}
                            />
                            <Detail
                                titre="Téléphone"
                                valeur={selection.telephone}
                            />
                            <Detail
                                titre="Téléphone secondaire"
                                valeur={selection.telephone_secondaire}
                            />
                            <Detail titre="Email" valeur={selection.email} />
                            <Detail titre="Adresse" valeur={selection.adresse} />
                            <Detail titre="Commune" valeur={selection.commune} />
                            <Detail titre="Ville" valeur={selection.ville} />
                            <Detail titre="Profession" valeur={selection.profession} />
                            <Detail
                                titre="Province"
                                valeur={selection.province_nom}
                            />
                            <Detail titre="Zone" valeur={selection.zone_nom} />
                            <Detail
                                titre="Coordination"
                                valeur={selection.coordination_nom}
                            />
                            <Detail
                                titre="Origine"
                                valeur={
                                    selection.source === "agent"
                                        ? "Agent"
                                        : "Demande publique"
                                }
                            />
                            <Detail
                                titre="Date de création"
                                valeur={dateFr(selection.date_creation)}
                            />
                            <Detail
                                titre="Motif du rejet"
                                valeur={selection.motif_rejet}
                            />
                        </div>

                        {selection.statut === "en_attente" && (
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 10,
                                    marginTop: 24,
                                }}
                            >
                                <button
                                    type="button"
                                    disabled={traitementId === selection.id}
                                    style={{
                                        ...styles.button,
                                        background: "#16a34a",
                                        color: "#fff",
                                    }}
                                    onClick={() => approuver(selection)}
                                >
                                    Approuver la demande
                                </button>

                                <button
                                    type="button"
                                    disabled={traitementId === selection.id}
                                    style={{
                                        ...styles.button,
                                        background: "#dc2626",
                                        color: "#fff",
                                    }}
                                    onClick={() => rejeter(selection)}
                                >
                                    Rejeter la demande
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}