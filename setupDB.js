// setupDB.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./soul_chronicles.db');

db.serialize(() => {
    // Table utilisateurs
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        country TEXT DEFAULT 'Global',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Table statistiques
    db.run(`CREATE TABLE IF NOT EXISTS game_stats (
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
    )`);

    // Trigger automatique pour créer les stats
    db.run(`CREATE TRIGGER IF NOT EXISTS after_user_insert
        AFTER INSERT ON users
        BEGIN
            INSERT INTO game_stats (user_id) VALUES (NEW.id);
        END;`);

    console.log("Database initialized!");
});

db.close();