import crypto from "crypto";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";

import pool from "../config/database.js";

const DOSSIER_CARTES = path.join(
    process.cwd(),
    "cartes_membres"
);

if (!fs.existsSync(DOSSIER_CARTES)) {
    fs.mkdirSync(DOSSIER_CARTES, {
        recursive: true
    });
}

// ============================================================
// RECUPERER LES INFORMATIONS COMPLETES D'UN MEMBRE
// ============================================================

const getMemberForCard = async (memberId) => {
    const result = await pool.query(
        `
        SELECT
            m.id,
            m.matricule,
            m.nom,
            m.postnom,
            m.prenom,
            m.sexe,
            m.date_naissance,
            m.telephone,
            m.email,
            m.photo_url,
            m.date_adhesion,
            m.date_expiration,
            m.actif,

            z.id AS zone_id,
            z.nom AS zone_nom,

            c.id AS coordination_id,
            c.nom AS coordination_nom,

            p.id AS province_id,
            p.nom AS province_nom,

            f.id AS fonction_id,
            f.nom AS fonction_nom,

            s.id AS status_id,
            s.nom AS status_nom

        FROM members m

        LEFT JOIN zones z
            ON z.id = m.zone_id

        LEFT JOIN coordinations c
            ON c.id = m.coordination_id

        LEFT JOIN provinces p
            ON p.id = z.province_id

        LEFT JOIN member_functions f
            ON f.id = m.fonction_id

        LEFT JOIN member_statuses s
            ON s.id = m.status_id

        WHERE m.id = $1

        LIMIT 1
        `,
        [memberId]
    );

    return result.rows[0] || null;
};

// ============================================================
// GENERER UNE CARTE
// ============================================================

export const generateMemberCard = async (memberId) => {
    const membre = await getMemberForCard(memberId);

    if (!membre) {
        throw new Error("MEMBRE_INTRouvable");
    }

    if (!membre.actif) {
        throw new Error("MEMBRE_INACTIF");
    }

    // Désactiver les anciennes cartes du membre
    await pool.query(
        `
        UPDATE member_cards
        SET active = FALSE
        WHERE member_id = $1
        `,
        [memberId]
    );

    const qrToken = crypto.randomUUID();

    const annee = new Date().getFullYear();

    const numeroCarte =
        `FEN-${annee}-${String(memberId).padStart(6, "0")}`;

    const verificationBaseUrl =
        process.env.PUBLIC_API_URL ||
        `http://localhost:${process.env.PORT || 5000}`;

    const verificationUrl =
        `${verificationBaseUrl}/api/cards/verify/${qrToken}`;

    // QR Code
    const qrDataUrl = await QRCode.toDataURL(
        verificationUrl,
        {
            width: 500,
            margin: 2,
            errorCorrectionLevel: "H"
        }
    );

    // Date d'expiration
    let dateExpiration = membre.date_expiration;

    if (!dateExpiration) {
        const expiration = new Date();
        expiration.setFullYear(
            expiration.getFullYear() + 1
        );

        dateExpiration =
            expiration.toISOString().split("T")[0];
    }

    // Enregistrer la carte
    const cardResult = await pool.query(
        `
        INSERT INTO member_cards
        (
            member_id,
            numero_carte,
            qr_token,
            date_generation,
            date_expiration,
            active
        )
        VALUES
        (
            $1,
            $2,
            $3,
            CURRENT_TIMESTAMP,
            $4,
            TRUE
        )
        RETURNING *
        `,
        [
            memberId,
            numeroCarte,
            qrToken,
            dateExpiration
        ]
    );

    const carte = cardResult.rows[0];

    return {
        carte,
        membre,
        qrDataUrl,
        verificationUrl
    };
};

// ============================================================
// RECUPERER LA CARTE ACTIVE
// ============================================================

export const getActiveMemberCard = async (memberId) => {
    const result = await pool.query(
        `
        SELECT
            mc.id,
            mc.member_id,
            mc.numero_carte,
            mc.qr_token,
            mc.date_generation,
            mc.date_expiration,
            mc.fichier_pdf,
            mc.active
        FROM member_cards mc
        WHERE mc.member_id = $1
        AND mc.active = TRUE
        ORDER BY mc.id DESC
        LIMIT 1
        `,
        [memberId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const carte = result.rows[0];

    const verificationBaseUrl =
        process.env.PUBLIC_API_URL ||
        `http://localhost:${process.env.PORT || 5000}`;

    const verificationUrl =
        `${verificationBaseUrl}/api/cards/verify/${carte.qr_token}`;

    const qrDataUrl = await QRCode.toDataURL(
        verificationUrl,
        {
            width: 500,
            margin: 2,
            errorCorrectionLevel: "H"
        }
    );

    const membre = await getMemberForCard(memberId);

    return {
        carte,
        membre,
        qrDataUrl,
        verificationUrl
    };
};

// ============================================================
// GENERER LE PDF DE LA CARTE
// ============================================================

export const generateMemberCardPdf = async (memberId) => {
    let data = await getActiveMemberCard(memberId);

    if (!data) {
        data = await generateMemberCard(memberId);
    }

    const {
        carte,
        membre,
        qrDataUrl
    } = data;

    const nomComplet = [
        membre.nom,
        membre.postnom,
        membre.prenom
    ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();

    const fichierNom =
        `${carte.numero_carte}.pdf`;

    const fichierPath =
        path.join(DOSSIER_CARTES, fichierNom);

    const doc = new PDFDocument({
        size: [242.65, 153.07],
        margin: 0
    });

    const stream = fs.createWriteStream(
        fichierPath
    );

    doc.pipe(stream);

    // ========================================================
    // RECTO
    // ========================================================

    doc
        .rect(0, 0, 242.65, 153.07)
        .fill("#ffffff");

    // En-tête
    doc
        .rect(0, 0, 242.65, 38)
        .fill("#0b3d91");

    doc
        .fillColor("#ffffff")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(
            "FONDATION ÉZÉCHIEL NTAL",
            12,
            7,
            {
                width: 218,
                align: "center"
            }
        );

    doc
        .fontSize(7)
        .font("Helvetica")
        .text(
            "F.E.N ASBL",
            12,
            20,
            {
                width: 218,
                align: "center"
            }
        );

    // Titre
    doc
        .fillColor("#0b3d91")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text(
            "CARTE DE MEMBRE",
            12,
            45
        );

    // Photo
    let photoAjoutee = false;

    if (membre.photo_url) {
        try {
            if (
                membre.photo_url.startsWith("data:image/")
            ) {
                const base64Data =
                    membre.photo_url.split(",")[1];

                const buffer =
                    Buffer.from(
                        base64Data,
                        "base64"
                    );

                doc.image(
                    buffer,
                    12,
                    60,
                    {
                        fit: [65, 65],
                        align: "center",
                        valign: "center"
                    }
                );

                photoAjoutee = true;
            } else if (
                membre.photo_url.startsWith("http://") ||
                membre.photo_url.startsWith("https://")
            ) {
                try {
                    const response =
                        await fetch(membre.photo_url);

                    if (response.ok) {
                        const buffer =
                            Buffer.from(
                                await response.arrayBuffer()
                            );

                        doc.image(
                            buffer,
                            12,
                            60,
                            {
                                fit: [65, 65],
                                align: "center",
                                valign: "center"
                            }
                        );

                        photoAjoutee = true;
                    }
                } catch {
                    // Photo non disponible
                }
            } else if (
                fs.existsSync(membre.photo_url)
            ) {
                doc.image(
                    membre.photo_url,
                    12,
                    60,
                    {
                        fit: [65, 65],
                        align: "center",
                        valign: "center"
                    }
                );

                photoAjoutee = true;
            }
        } catch {
            // Photo non disponible
        }
    }

    if (!photoAjoutee) {
        doc
            .rect(12, 60, 65, 65)
            .stroke("#cccccc");

        doc
            .fillColor("#777777")
            .fontSize(7)
            .text(
                "PHOTO",
                12,
                88,
                {
                    width: 65,
                    align: "center"
                }
            );
    }

    // Informations membre
    const xInfo = 85;

    doc
        .fillColor("#111111")
        .fontSize(7)
        .font("Helvetica-Bold")
        .text(
            "NOM COMPLET",
            xInfo,
            60
        );

    doc
        .font("Helvetica")
        .fontSize(7)
        .text(
            nomComplet,
            xInfo,
            70,
            {
                width: 100
            }
        );

    doc
        .font("Helvetica-Bold")
        .text(
            "MATRICULE",
            xInfo,
            84
        );

    doc
        .font("Helvetica")
        .text(
            membre.matricule || "-",
            xInfo,
            94
        );

    doc
        .font("Helvetica-Bold")
        .text(
            "FONCTION",
            xInfo,
            108
        );

    doc
        .font("Helvetica")
        .text(
            membre.fonction_nom || "Membre",
            xInfo,
            118,
            {
                width: 100
            }
        );

    // QR
    const qrBase64 =
        qrDataUrl.split(",")[1];

    const qrBuffer =
        Buffer.from(
            qrBase64,
            "base64"
        );

    doc.image(
        qrBuffer,
        190,
        55,
        {
            fit: [43, 43]
        }
    );

    doc
        .fillColor("#111111")
        .fontSize(5)
        .text(
            "Scanner pour vérifier",
            181,
            101,
            {
                width: 58,
                align: "center"
            }
        );

    // Numéro carte
    doc
        .fontSize(5)
        .text(
            carte.numero_carte,
            181,
            112,
            {
                width: 58,
                align: "center"
            }
        );

    // Pied de page
    doc
        .fillColor("#0b3d91")
        .rect(0, 137, 242.65, 16.07)
        .fill();

    doc
        .fillColor("#ffffff")
        .fontSize(5)
        .text(
            "Carte officielle de la Fondation Ézéchiel NTAL",
            8,
            143,
            {
                width: 226,
                align: "center"
            }
        );

    doc.end();

    await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
    });

    await pool.query(
        `
        UPDATE member_cards
        SET fichier_pdf = $1
        WHERE id = $2
        `,
        [
            fichierPath,
            carte.id
        ]
    );

    return {
        fichierPath,
        fichierNom,
        carte,
        membre,
        qrDataUrl
    };
};

// ============================================================
// VERIFIER UNE CARTE PAR QR TOKEN
// ============================================================

export const verifyMemberCard = async (
    qrToken,
    adresseIp,
    userAgent
) => {
    const result = await pool.query(
        `
        SELECT
            mc.id AS card_id,
            mc.member_id,
            mc.numero_carte,
            mc.qr_token,
            mc.date_generation,
            mc.date_expiration,
            mc.active,

            m.matricule,
            m.nom,
            m.postnom,
            m.prenom,
            m.photo_url,
            m.actif AS membre_actif,

            z.nom AS zone_nom,
            c.nom AS coordination_nom,
            p.nom AS province_nom,

            f.nom AS fonction_nom,
            s.nom AS status_nom

        FROM member_cards mc

        INNER JOIN members m
            ON m.id = mc.member_id

        LEFT JOIN zones z
            ON z.id = m.zone_id

        LEFT JOIN coordinations c
            ON c.id = m.coordination_id

        LEFT JOIN provinces p
            ON p.id = z.province_id

        LEFT JOIN member_functions f
            ON f.id = m.fonction_id

        LEFT JOIN member_statuses s
            ON s.id = m.status_id

        WHERE mc.qr_token = $1
        LIMIT 1
        `,
        [qrToken]
    );

    if (result.rows.length === 0) {
        return {
            valide: false,
            message: "Carte introuvable."
        };
    }

    const carte = result.rows[0];

    const maintenant = new Date();

    const expiree =
        carte.date_expiration &&
        new Date(carte.date_expiration) < maintenant;

    const valide =
        carte.active === true &&
        carte.membre_actif === true &&
        !expiree;

    await pool.query(
        `
        INSERT INTO card_verifications
        (
            card_id,
            date_verification,
            adresse_ip,
            user_agent,
            resultat
        )
        VALUES
        (
            $1,
            CURRENT_TIMESTAMP,
            $2,
            $3,
            $4
        )
        `,
        [
            carte.card_id,
            adresseIp || null,
            userAgent || null,
            valide
        ]
    );

    if (!valide) {
        return {
            valide: false,
            message: expiree
                ? "Cette carte est expirée."
                : "Cette carte n'est plus active.",
            carte: {
                numero_carte: carte.numero_carte
            }
        };
    }

    return {
        valide: true,
        message: "Carte valide.",
        membre: {
            matricule: carte.matricule,
            nom: carte.nom,
            postnom: carte.postnom,
            prenom: carte.prenom,
            photo_url: carte.photo_url,
            fonction: carte.fonction_nom,
            statut: carte.status_nom,
            province: carte.province_nom,
            zone: carte.zone_nom,
            coordination: carte.coordination_nom
        },
        carte: {
            numero_carte: carte.numero_carte,
            date_generation: carte.date_generation,
            date_expiration: carte.date_expiration
        }
    };
};