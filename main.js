// =======================
// Soul Chronicles main.js
// =======================

document.addEventListener('DOMContentLoaded', async () => {
    // --- Setup DB (si c?t? navigateur) ---
    if (window.LeadGenRuntime && window.LeadGenRuntime.executeSql) {
        await setupDatabase();
    }

    // --- PATH ROUTING ---
    const path = window.location.pathname;
    const user = JSON.parse(localStorage.getItem('soul_chronicles_user'));

    if (path.includes('game.html') && !user) {
        window.location.href = 'index.html';
        return;
    }

    // --- INITIALIZATION ---
    if (document.getElementById('loginForm')) {
        initAuthPage();
    } else if (document.getElementById('playerLevel')) {
        initGamePage(user);
    }
});

// =======================
// DATABASE SETUP
// =======================
async function setupDatabase() {
    await window.LeadGenRuntime.executeSql(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            country TEXT DEFAULT 'Global',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await window.LeadGenRuntime.executeSql(`
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
        )
    `);

    await window.LeadGenRuntime.executeSql(`
        CREATE TRIGGER IF NOT EXISTS after_user_insert
        AFTER INSERT ON users
        BEGIN
            INSERT INTO game_stats (user_id) VALUES (NEW.id);
        END;
    `);

    console.log("Database initialized!");
}

// =======================
// AUTH LOGIC
// =======================
function initAuthPage() {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');

    // --- Tab Switching ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + '-form').classList.add('active');
        });
    });

    // --- REGISTER ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // --- Hash mot de passe (simple Base64 pour test, remplacer par bcrypt c?t? serveur) ---
            data.password_hash = btoa(data.password);
            delete data.password;

            try {
                await window.LeadGenRuntime.insertData('users', data);
                alert("Compte cr?? avec succ?s ! Vous pouvez maintenant vous connecter.");
                tabs[0].click();
                e.target.reset();
            } catch (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    alert("Erreur : Cet email ou pseudo est d?j? utilis?.");
                } else {
                    alert("Erreur d'inscription : " + err.message);
                }
            }
        });
    }

    // --- LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');

            try {
                const hashedPassword = btoa(password); // doit correspondre au hash stock?
                const result = await window.LeadGenRuntime.loginUser('users', email, hashedPassword);

                localStorage.setItem('soul_chronicles_user', JSON.stringify(result.user));
                window.location.href = 'game.html';
            } catch (err) {
                alert("Erreur de connexion : " + err.message);
            }
        });
    }
}

// =======================
// GAME LOGIC
// =======================
// Ton code SoulGame reste inchang?, sauf suppression de la cr?ation manuelle des stats
function initGamePage(user) {
    window.game = new SoulGame(user);

    document.getElementById('playerAvatar').src = 'images/avatar.jpg';
    document.getElementById('combatPlayerImg').src = 'images/avatar.jpg';
}

// =======================
// Ici tu peux copier tout le reste de la classe SoulGame
// en laissant l'initialisation et le chargement des stats depuis la DB
// =======================