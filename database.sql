-- Table utilisateurs (authentification)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    country TEXT DEFAULT 'Global',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table statistiques des joueurs
CREATE TABLE IF NOT EXISTS game_stats (
    user_id INTEGER PRIMARY KEY,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    max_xp INTEGER NOT NULL DEFAULT 100,
    str INTEGER NOT NULL DEFAULT 5,
    agi INTEGER NOT NULL DEFAULT 5,
    int INTEGER NOT NULL DEFAULT 5,
    hp INTEGER NOT NULL DEFAULT 100,
    max_hp INTEGER NOT NULL DEFAULT 100,
    energy INTEGER NOT NULL DEFAULT 50,
    max_energy INTEGER NOT NULL DEFAULT 50,
    rank TEXT NOT NULL DEFAULT 'Novice',
    wins INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Trigger pour créer automatiquement les stats quand un utilisateur est créé
CREATE TRIGGER IF NOT EXISTS after_user_insert
AFTER INSERT ON users
BEGIN
    INSERT INTO game_stats (user_id) VALUES (NEW.id);
END;

-- Table des missions complétées par utilisateur
CREATE TABLE IF NOT EXISTS user_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mission_id INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des clans
CREATE TABLE IF NOT EXISTS clans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    level INTEGER DEFAULT 1,
    territories INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des membres de clan
CREATE TABLE IF NOT EXISTS clan_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clan_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'Recrue',
    power INTEGER DEFAULT 0,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(clan_id) REFERENCES clans(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Historique des combats
CREATE TABLE IF NOT EXISTS combat_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    enemy_name TEXT NOT NULL,
    enemy_level INTEGER NOT NULL,
    result TEXT CHECK(result IN ('win','lose')),
    xp_gained INTEGER DEFAULT 0,
    combat_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index utiles pour le leaderboard et performances
CREATE INDEX IF NOT EXISTS idx_game_stats_level ON game_stats(level DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_rank ON game_stats(rank);
CREATE INDEX IF NOT EXISTS idx_combat_log_user ON combat_log(user_id);