-- ============================================================
-- IT Asset Management System - MySQL Schema (DDL)
-- Engine: InnoDB (required for FK + transactions)
-- Charset: utf8mb4 for full Unicode / Thai support
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Users / Employees
-- Roles: admin | staff | user
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(150)    NOT NULL,
  email         VARCHAR(190)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  role          ENUM('admin','staff','user') NOT NULL DEFAULT 'user',
  department    VARCHAR(120)    NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  KEY idx_users_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Sessions (server-side session tokens for auth)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  token       CHAR(64)        NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  expires_at  TIMESTAMP       NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Assets
-- Status: in_stock | in_use | under_repair | retired
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tag_id          VARCHAR(64)     NOT NULL,          -- Asset Tag ID (printed on sticker / QR)
  name            VARCHAR(190)    NOT NULL,          -- Item name
  category        VARCHAR(80)     NULL,              -- Laptop, Monitor, Phone, etc.
  serial_number   VARCHAR(120)    NULL,
  brand           VARCHAR(80)     NULL,
  model           VARCHAR(120)    NULL,
  spec            TEXT            NULL,
  status          ENUM('in_stock','in_use','under_repair','retired') NOT NULL DEFAULT 'in_stock',
  location        VARCHAR(150)    NULL,
  purchase_date   DATE            NULL,
  warranty_expire DATE            NULL,
  price           DECIMAL(12,2)   NULL,
  invoice_po      VARCHAR(120)    NULL,              -- Invoice / PO number
  assigned_to     BIGINT UNSIGNED NULL,              -- current holder (denormalized for fast lookup)
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assets_tag (tag_id),
  UNIQUE KEY uq_assets_serial (serial_number),
  KEY idx_assets_status (status),
  KEY idx_assets_category (category),
  KEY idx_assets_assigned (assigned_to),
  KEY idx_assets_warranty (warranty_expire),
  CONSTRAINT fk_assets_assigned FOREIGN KEY (assigned_to)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Assignments / Checkout history (borrow - return log)
-- Status: checked_out | returned | overdue
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id           BIGINT UNSIGNED NOT NULL,
  user_id            BIGINT UNSIGNED NOT NULL,
  checkout_date      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_return    DATE            NULL,
  actual_return_date TIMESTAMP       NULL,
  status             ENUM('checked_out','returned','overdue') NOT NULL DEFAULT 'checked_out',
  checkout_by        BIGINT UNSIGNED NULL,           -- staff/admin who processed it
  notes              VARCHAR(255)    NULL,
  created_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assign_asset (asset_id),
  KEY idx_assign_user (user_id),
  KEY idx_assign_status (status),
  -- fast lookup of the currently-open assignment for an asset
  KEY idx_assign_open (asset_id, status),
  CONSTRAINT fk_assign_asset FOREIGN KEY (asset_id)
    REFERENCES assets (id) ON DELETE CASCADE,
  CONSTRAINT fk_assign_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_assign_by FOREIGN KEY (checkout_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Software & Licenses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS software_licenses (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  software_name  VARCHAR(190)    NOT NULL,
  license_key    VARCHAR(255)    NULL,
  vendor         VARCHAR(120)    NULL,
  total_seats    INT UNSIGNED    NOT NULL DEFAULT 1,
  assigned_seats INT UNSIGNED    NOT NULL DEFAULT 0,
  purchase_date  DATE            NULL,
  expiration_date DATE           NULL,
  price          DECIMAL(12,2)   NULL,
  notes          VARCHAR(255)    NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lic_name (software_name),
  KEY idx_lic_expiration (expiration_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: which user holds which license seat
CREATE TABLE IF NOT EXISTS license_assignments (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  license_id  BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_license_user (license_id, user_id),
  KEY idx_licassign_user (user_id),
  CONSTRAINT fk_licassign_license FOREIGN KEY (license_id)
    REFERENCES software_licenses (id) ON DELETE CASCADE,
  CONSTRAINT fk_licassign_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Maintenance Logs
-- Status: open | in_progress | completed | cancelled
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id      BIGINT UNSIGNED NOT NULL,
  issue_detail  TEXT            NOT NULL,
  repair_cost   DECIMAL(12,2)   NULL,
  vendor        VARCHAR(150)    NULL,               -- Vendor / Service Center
  repair_date   DATE            NULL,
  status        ENUM('open','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
  reported_by   BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_maint_asset (asset_id),
  KEY idx_maint_status (status),
  KEY idx_maint_date (repair_date),
  CONSTRAINT fk_maint_asset FOREIGN KEY (asset_id)
    REFERENCES assets (id) ON DELETE CASCADE,
  CONSTRAINT fk_maint_reporter FOREIGN KEY (reported_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
