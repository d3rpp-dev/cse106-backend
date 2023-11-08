-- Issues
DROP TABLE IF EXISTS `issues`;

CREATE TABLE IF NOT EXISTS `issues` (
	'id' TEXT PRIMARY KEY,
	'user_id' TEXT,
	'subject' TEXT,
	'opened_ts' INTEGER,
	'closed_ts' INTEGER
);

-- admin password hash - is "admin" - $argon2i$v=19$m=65536,t=4,p=1$Y1BCVXJCMXF5Z0kvakhwWA$J1T5/+mSOY0xZGUOBdiDL8y+UY09yM3NoSfX+5GzAto

DROP TABLE IF EXISTS `passwords`;


CREATE TABLE IF NOT EXISTS `passwords` (
	'user_id' TEXT PRIMARY KEY,
	'hash' TEXT
);

DROP TABLE IF EXISTS `users`;

CREATE TABLE IF NOT EXISTS `users` (
	'id' TEXT PRIMARY KEY,
	'email' TEXT,
	'given_name' TEXT,
	'family_name' TEXT,
	'nhi' TEXT,
	'dob_ts' INTEGER,
	'qrcode_status' INTEGER
);

-- Vaccinations

DROP TABLE IF EXISTS `vaccinations`;

CREATE TABLE IF NOT EXISTS `vaccinations` (
	'id' TEXT PRIMARY KEY,
	'user_id' TEXT,
	'ts' INTEGER,
	'brand' TEXT,
	'location' TEXT
);

-- Tests

DROP TABLE IF EXISTS `tests`;

CREATE TABLE IF NOT EXISTS `tests` (
	'id' TEXT PRIMARY KEY,
	'user_id' TEXT,
	'ts' INTEGER,
	'result' INTEGER, -- 0 or 1 = Neg/Pos
	'type' TEXT
);

-- QR Codes

DROP TABLE IF EXISTS `qr_codes`;

CREATE TABLE IF NOT EXISTS `qr_codes` (
	'id' TEXT PRIMARY KEY,
	'expiry' INTEGER,
	'token' TEXT
);

-- Logs

DROP TABLE IF EXISTS `logs`;

CREATE TABLE IF NOT EXISTS `logs` (
	'id' TEXT PRIMARY KEY,
	'event' TEXT,
	'detail' TEXT
);
