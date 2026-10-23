import React, { useEffect, useState } from "react";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f3f6fc",
        padding: "30px 15px",
        fontFamily: "Arial, sans-serif",
        color: "#1e293b",
    },
    container: {
        maxWidth: "850px",
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(15, 23, 42, 0.10)",
    },
    header: {
        background: "linear-gradient(135deg, #123b80, #1d5bc4)",
        color: "#ffffff",
        padding: "35px 25px",
        textAlign: "center",
    },
    logo: {
        width: "65px",
        height: "65px",
        border: "3px solid #facc15",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 15px",
        fontSize: "23px",
        fontWeight: "bold",
        color: "#facc15",
    },
    content: {
        padding: "30px",
    },
    sectionTitle: {
        color: "#17458d",
        fontSize: "17px",
        fontWeight: "bold",
        borderBottom: "2px solid #facc15",
        paddingBottom: "10px",
        marginTop: "25px",
        marginBottom: "20px",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
    },
    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: "bold",
        marginBottom: "7px",
        color: "#334155",
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        fontSize: "14px",
        outlineColor: "#1d5bc4",
        background: "#ffffff",
    },
    button: {
        width: "100%",
        padding: "15px",
        marginTop: "25px",
        border: "none",
        borderRadius: "9px",
        background: "#17458d",
        color: "#ffffff",
        fontSize: "15px",
        fontWeight: "bold",
        cursor: "pointer",
    },
    message: {
        padding: "13px",
        borderRadius: "8px",
        marginBottom: "20px",
        fontSize: "14px",
        lineHeight: "1.5",
    },
    footer: {
        background: "#f8fafc",
        borderTop: "1px solid #e2e8f0",
        padding: "20px",
        textAlign: "center",
        fontSize: "12px",
        color: "#64748b",
    },
};

export default function FormulaireAdhesion() {
    const [provinces, setProvinces] = useState([]);
    const [zones, setZones] = useState([]);
    const [coordinations, setCoordinations] = useState([]);

    const [provinceId, setProvinceId] = useState("");
    const [zoneId, setZoneId] = useState("");
    const [coordinationId, setCoordinationId] = useState("");

    const [chargementOptions, setChargementOptions] = useState(true);
    const [envoi, setEnvoi] = useState(false);
    const [erreur, setErreur] = useState("");
    const [succes, setSucces] = useState("");

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
        ville: "Kinshasa",
        profession: "",
    });

    useEffect(() => {
        chargerOptions();
    }, []);

    async function chargerOptions() {
        setChargementOptions(true);
        setErreur("");

        try {
            const response = await fetch(
                `${API_URL}/api/membership-requests/options`
            );

            const data = await response.json();

            if (!response.ok || data.succes === false) {
                throw new Error(
                    data.message || "Impossible de charger les provinces et coordinations."
                );
            }

            setProvinces(data.provinces || []);
            setZones(data.zones || []);
            setCoordinations(data.coordinations || []);
        } catch (error) {
            setErreur(
                error.message ||
                    "Erreur de connexion au serveur. Vérifiez que le backend fonctionne."
            );
        } finally {
            setChargementOptions(false);
        }
    }

    function modifierChamp(e) {
        const { name, value } = e.target;

        setFormulaire((ancien) => ({
            ...ancien,
            [name]: value,
        }));
    }

    function modifierProvince(e) {
        setProvinceId(e.target.value);
        setZoneId("");
        setCoordinationId("");
    }

    function modifierZone(e) {
        setZoneId(e.target.value);
        setCoordinationId("");
    }

    const zonesFiltrees = zones.filter(
        (zone) => String(zone.province_id) === String(provinceId)
    );

    const coordinationsFiltrees = coordinations.filter(
        (coordination) => String(coordination.zone_id) === String(zoneId)
    );

    async function soumettreDemande(e) {
        e.preventDefault();

        setErreur("");
        setSucces("");

        if (!formulaire.nom.trim()) {
            setErreur("Veuillez saisir votre nom.");
            return;
        }

        if (!formulaire.prenom.trim()) {
            setErreur("Veuillez saisir votre prénom.");
            return;
        }

        if (!formulaire.telephone.trim()) {
            setErreur("Veuillez saisir votre numéro de téléphone.");
            return;
        }

        if (!zoneId) {
            setErreur("Veuillez sélectionner votre zone.");
            return;
        }

        if (!coordinationId) {
            setErreur("Veuillez sélectionner votre coordination.");
            return;
        }

        const donnees = {
            ...formulaire,
            zone_id: Number(zoneId),
            coordination_id: Number(coordinationId),
            sexe: formulaire.sexe || null,
            date_naissance: formulaire.date_naissance || null,
            telephone_secondaire:
                formulaire.telephone_secondaire.trim() || null,
            email: formulaire.email.trim() || null,
            adresse: formulaire.adresse.trim() || null,
            commune: formulaire.commune.trim() || null,
            profession: formulaire.profession.trim() || null,
        };

        setEnvoi(true);

        try {
            const response = await fetch(
                `${API_URL}/api/membership-requests/public`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(donnees),
                }
            );

            const data = await response.json();

            if (!response.ok || data.succes === false) {
                throw new Error(
                    data.message ||
                        "La demande n'a pas pu être envoyée."
                );
            }

            setSucces(
                data.message ||
                    "Votre demande d'adhésion a été envoyée avec succès. Elle sera examinée par les responsables de la Fondation."
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
                ville: "Kinshasa",
                profession: "",
            });

            setProvinceId("");
            setZoneId("");
            setCoordinationId("");

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } catch (error) {
            setErreur(
                error.message ||
                    "Une erreur est survenue pendant l'envoi de votre demande."
            );
        } finally {
            setEnvoi(false);
        }
    }

    function champ(
        nom,
        libelle,
        type = "text",
        obligatoire = false,
        placeholder = ""
    ) {
        return (
            <div key={nom}>
                <label htmlFor={nom} style={styles.label}>
                    {libelle}
                    {obligatoire ? " *" : ""}
                </label>

                <input
                    id={nom}
                    name={nom}
                    type={type}
                    value={formulaire[nom]}
                    onChange={modifierChamp}
                    placeholder={placeholder}
                    required={obligatoire}
                    style={styles.input}
                    autoComplete="on"
                />
            </div>
        );
    }

    function liste(
        id,
        libelle,
        valeur,
        modifier,
        options,
        texteInitial,
        obligatoire = true,
        desactive = false
    ) {
        return (
            <div>
                <label htmlFor={id} style={styles.label}>
                    {libelle}
                    {obligatoire ? " *" : ""}
                </label>

                <select
                    id={id}
                    value={valeur}
                    onChange={modifier}
                    required={obligatoire}
                    disabled={desactive}
                    style={{
                        ...styles.input,
                        cursor: desactive ? "not-allowed" : "pointer",
                        background: desactive ? "#f1f5f9" : "#ffffff",
                    }}
                >
                    <option value="">{texteInitial}</option>

                    {options.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.nom}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <div style={styles.logo}>F.E.N</div>

                    <h1
                        style={{
                            margin: "0 0 10px",
                            fontSize: "25px",
                        }}
                    >
                        FONDATION ÉZÉCHIEL NTAL
                    </h1>

                    <p
                        style={{
                            margin: 0,
                            color: "#fef08a",
                            fontWeight: "bold",
                        }}
                    >
                        F.E.N. ASBL
                    </p>

                    <p
                        style={{
                            margin: "15px 0 0",
                            fontSize: "14px",
                            lineHeight: "1.6",
                        }}
                    >
                        Ensemble pour l'espoir, Unis pour le changement
                    </p>
                </header>

                <main style={styles.content}>
                    <h2
                        style={{
                            margin: "0 0 10px",
                            color: "#17458d",
                            fontSize: "23px",
                        }}
                    >
                        Formulaire de demande d'adhésion
                    </h2>

                    <p
                        style={{
                            marginBottom: "25px",
                            color: "#64748b",
                            fontSize: "14px",
                            lineHeight: "1.6",
                        }}
                    >
                        Veuillez compléter les informations ci-dessous pour
                        soumettre votre demande d'adhésion à la Fondation.
                        Les champs marqués d'un astérisque (*) sont obligatoires.
                    </p>

                    {erreur && (
                        <div
                            role="alert"
                            style={{
                                ...styles.message,
                                background: "#fef2f2",
                                color: "#b91c1c",
                                border: "1px solid #fecaca",
                            }}
                        >
                            <strong>Erreur :</strong> {erreur}
                        </div>
                    )}

                    {succes && (
                        <div
                            role="status"
                            style={{
                                ...styles.message,
                                background: "#f0fdf4",
                                color: "#166534",
                                border: "1px solid #bbf7d0",
                            }}
                        >
                            <strong>Demande envoyée !</strong>
                            <br />
                            {succes}
                        </div>
                    )}

                    {chargementOptions ? (
                        <p>Chargement des provinces et coordinations...</p>
                    ) : (
                        <form onSubmit={soumettreDemande}>
                            <h3 style={styles.sectionTitle}>
                                1. Informations personnelles
                            </h3>

                            <div style={styles.grid}>
                                {champ(
                                    "nom",
                                    "Nom",
                                    "text",
                                    true,
                                    "Votre nom"
                                )}

                                {champ(
                                    "postnom",
                                    "Postnom",
                                    "text",
                                    false,
                                    "Votre postnom"
                                )}

                                {champ(
                                    "prenom",
                                    "Prénom",
                                    "text",
                                    true,
                                    "Votre prénom"
                                )}

                                <div>
                                    <label
                                        htmlFor="sexe"
                                        style={styles.label}
                                    >
                                        Sexe
                                    </label>

                                    <select
                                        id="sexe"
                                        name="sexe"
                                        value={formulaire.sexe}
                                        onChange={modifierChamp}
                                        style={styles.input}
                                    >
                                        <option value="">
                                            Sélectionner
                                        </option>
                                        <option value="M">Masculin</option>
                                        <option value="F">Féminin</option>
                                    </select>
                                </div>

                                {champ(
                                    "date_naissance",
                                    "Date de naissance",
                                    "date"
                                )}

                                {champ(
                                    "telephone",
                                    "Téléphone principal",
                                    "tel",
                                    true,
                                    "Ex. : +243..."
                                )}

                                {champ(
                                    "telephone_secondaire",
                                    "Téléphone secondaire",
                                    "tel",
                                    false,
                                    "Numéro secondaire"
                                )}

                                {champ(
                                    "email",
                                    "Adresse e-mail",
                                    "email",
                                    false,
                                    "exemple@email.com"
                                )}

                                {champ(
                                    "profession",
                                    "Profession",
                                    "text",
                                    false,
                                    "Votre profession"
                                )}
                            </div>

                            <h3 style={styles.sectionTitle}>
                                2. Adresse et localisation
                            </h3>

                            <div style={styles.grid}>
                                {champ(
                                    "adresse",
                                    "Adresse physique",
                                    "text",
                                    false,
                                    "Avenue, numéro..."
                                )}

                                {champ(
                                    "commune",
                                    "Commune ou territoire",
                                    "text",
                                    false,
                                    "Votre commune"
                                )}

                                {champ(
                                    "ville",
                                    "Ville",
                                    "text",
                                    false,
                                    "Votre ville"
                                )}

                                {liste(
                                    "province",
                                    "Province",
                                    provinceId,
                                    modifierProvince,
                                    provinces,
                                    "Choisir une province",
                                    true
                                )}

                                {liste(
                                    "zone",
                                    "Zone",
                                    zoneId,
                                    modifierZone,
                                    zonesFiltrees,
                                    provinceId
                                        ? "Choisir une zone"
                                        : "Choisir d'abord une province",
                                    true,
                                    !provinceId
                                )}

                                {liste(
                                    "coordination",
                                    "Coordination",
                                    coordinationId,
                                    (e) =>
                                        setCoordinationId(e.target.value),
                                    coordinationsFiltrees,
                                    zoneId
                                        ? "Choisir une coordination"
                                        : "Choisir d'abord une zone",
                                    true,
                                    !zoneId
                                )}
                            </div>

                            <p
                                style={{
                                    fontSize: "12px",
                                    color: "#64748b",
                                    marginTop: "18px",
                                    lineHeight: "1.6",
                                }}
                            >
                                Vérifiez vos informations avant d'envoyer votre
                                demande. Les responsables de la Fondation
                                examineront votre dossier.
                            </p>

                            <button
                                type="submit"
                                disabled={envoi}
                                style={{
                                    ...styles.button,
                                    opacity: envoi ? 0.7 : 1,
                                    cursor: envoi
                                        ? "not-allowed"
                                        : "pointer",
                                }}
                            >
                                {envoi
                                    ? "ENVOI EN COURS..."
                                    : "ENVOYER MA DEMANDE D'ADHÉSION"}
                            </button>
                        </form>
                    )}
                </main>

                <footer style={styles.footer}>
                    <p
                        style={{
                            margin: "0 0 8px",
                            fontWeight: "bold",
                            color: "#17458d",
                        }}
                    >
                        L'Amour • L'Unité • Le Travail
                    </p>

                    <p style={{ margin: 0 }}>
                        © {new Date().getFullYear()} Fondation Ézéchiel NTAL.
                        Tous droits réservés.
                    </p>
                </footer>
            </div>
        </div>
    );
}