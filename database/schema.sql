-- ============================================================
-- F.E.N ASBL - GESTION DES MEMBRES
-- Schéma PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- UTILISATEURS DE L'APPLICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    date_creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_role_check
        CHECK (
            role IN (
                'super_admin',
                'admin',
                'responsable_zone',
                'responsable_coordination',
                'agent'
            )
        )
);


-- ============================================================
-- ZONES
-- ============================================================

CREATE TABLE IF NOT EXISTS zones (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    date_creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- COORDINATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS coordinations (
    id BIGSERIAL PRIMARY KEY,
    zone_id BIGINT NOT NULL,
    nom VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    date_creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_coordination_zone
        FOREIGN KEY (zone_id)
        REFERENCES zones(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT unique_coordination_dans_zone
        UNIQUE (zone_id, nom)
);


-- ============================================================
-- STATUTS DES MEMBRES
-- ============================================================

CREATE TABLE IF NOT EXISTS member_statuses (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    actif BOOLEAN NOT NULL DEFAULT TRUE
);


-- ============================================================
-- FONCTIONS DES MEMBRES
-- ============================================================

CREATE TABLE IF NOT EXISTS member_functions (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    actif BOOLEAN NOT NULL DEFAULT TRUE
);


-- ============================================================
-- MEMBRES
-- ============================================================

CREATE TABLE IF NOT EXISTS members (
    id BIGSERIAL PRIMARY KEY,

    matricule VARCHAR(30) NOT NULL UNIQUE,

    nom VARCHAR(100) NOT NULL,
    postnom VARCHAR(100),
    prenom VARCHAR(100) NOT NULL,

    sexe VARCHAR(20),

    date_naissance DATE,

    telephone VARCHAR(30) NOT NULL,
    telephone_secondaire VARCHAR(30),

    email VARCHAR(255),

    adresse TEXT,
    commune VARCHAR(100),
    ville VARCHAR(100),

    profession VARCHAR(150),

    photo_url TEXT,

    zone_id BIGINT NOT NULL,
    coordination_id BIGINT NOT NULL,

    status_id BIGINT NOT NULL,
    fonction_id BIGINT,

    date_adhesion DATE NOT NULL DEFAULT CURRENT_DATE,
    date_expiration DATE,

    observations TEXT,

    actif BOOLEAN NOT NULL DEFAULT TRUE,

    date_creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_member_zone
        FOREIGN KEY (zone_id)
        REFERENCES zones(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_member_coordination
        FOREIGN KEY (coordination_id)
        REFERENCES coordinations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_member_status
        FOREIGN KEY (status_id)
        REFERENCES member_statuses(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_member_function
        FOREIGN KEY (fonction_id)
        REFERENCES member_functions(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT members_sexe_check
        CHECK (
            sexe IS NULL
            OR sexe IN ('M', 'F')
        )
);


-- ============================================================
-- CARTES DE MEMBRES
-- ============================================================

CREATE TABLE IF NOT EXISTS member_cards (
    id BIGSERIAL PRIMARY KEY,

    member_id BIGINT NOT NULL UNIQUE,

    numero_carte VARCHAR(50) NOT NULL UNIQUE,

    qr_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

    date_generation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    date_expiration DATE,

    fichier_pdf TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_card_member
        FOREIGN KEY (member_id)
        REFERENCES members(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- VERIFICATION DES CARTES
-- ============================================================

CREATE TABLE IF NOT EXISTS card_verifications (
    id BIGSERIAL PRIMARY KEY,

    card_id BIGINT NOT NULL,

    date_verification TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    adresse_ip INET,

    user_agent TEXT,

    resultat BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_verification_card
        FOREIGN KEY (card_id)
        REFERENCES member_cards(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- JOURNAL DES ACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT,

    action VARCHAR(100) NOT NULL,

    table_concernee VARCHAR(100),

    enregistrement_id BIGINT,

    ancienne_valeur JSONB,

    nouvelle_valeur JSONB,

    adresse_ip INET,

    date_creation TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- ============================================================
-- INDEX POUR LES RECHERCHES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_members_nom
    ON members(nom);

CREATE INDEX IF NOT EXISTS idx_members_postnom
    ON members(postnom);

CREATE INDEX IF NOT EXISTS idx_members_prenom
    ON members(prenom);

CREATE INDEX IF NOT EXISTS idx_members_telephone
    ON members(telephone);

CREATE INDEX IF NOT EXISTS idx_members_email
    ON members(email);

CREATE INDEX IF NOT EXISTS idx_members_zone
    ON members(zone_id);

CREATE INDEX IF NOT EXISTS idx_members_coordination
    ON members(coordination_id);

CREATE INDEX IF NOT EXISTS idx_members_status
    ON members(status_id);

CREATE INDEX IF NOT EXISTS idx_members_matricule
    ON members(matricule);

CREATE INDEX IF NOT EXISTS idx_coordinations_zone
    ON coordinations(zone_id);

CREATE INDEX IF NOT EXISTS idx_card_qr_token
    ON member_cards(qr_token);

CREATE INDEX IF NOT EXISTS idx_audit_user
    ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_date
    ON audit_logs(date_creation);


-- ============================================================
-- DONNEES INITIALES
-- ============================================================

INSERT INTO member_statuses (nom, description)
VALUES
    ('actif', 'Membre actif de la fondation'),
    ('inactif', 'Membre temporairement inactif'),
    ('suspendu', 'Membre suspendu'),
    ('honoraire', 'Membre honoraire')
ON CONFLICT (nom) DO NOTHING;


INSERT INTO member_functions (nom, description)
VALUES
    ('Membre', 'Membre de la fondation'),
    ('Président', 'Président'),
    ('Vice-président', 'Vice-président'),
    ('Secrétaire', 'Secrétaire'),
    ('Trésorier', 'Trésorier'),
    ('Responsable de zone', 'Responsable d’une zone'),
    ('Responsable de coordination', 'Responsable d’une coordination'),
    ('Agent', 'Agent de la fondation')
ON CONFLICT (nom) DO NOTHING;