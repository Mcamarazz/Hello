document.addEventListener('DOMContentLoaded', () => {
    // === PATH ROUTING ===
    const path = window.location.pathname;
    
    // Check if we are on the game page but not logged in
    const user = JSON.parse(localStorage.getItem('soul_chronicles_user'));
    
    if (path.includes('game.html') && !user) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize based on page
    if (document.getElementById('loginForm')) {
        initAuthPage();
    } else if (document.getElementById('playerLevel')) {
        initGamePage(user);
    }
});

// === AUTH LOGIC (AMÉLIORÉ) ===
function initAuthPage() {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    const errorDivs = document.querySelectorAll('.error-msg');

    // Gestion des tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            errorDivs.forEach(e => e.textContent = '');

            tab.classList.add('active');
            const targetId = tab.dataset.tab + '-form';
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const email = formData.get('email').trim();
            const password = formData.get('password').trim();

            if (!email || !password) {
                showError('login', "Veuillez remplir tous les champs.");
                return;
            }

            toggleLoader('login', true);

            try {
                // Hash simple côté client pour simulation (en vrai côté serveur)
                const hashedPassword = btoa(password);

                const result = await window.LeadGenRuntime.loginUser('users', email, hashedPassword);
                
                localStorage.setItem('soul_chronicles_user', JSON.stringify(result.user));

                // Initial stats if new
                if (!localStorage.getItem(`stats_${result.user.id}`)) {
                    const initialStats = {
                        str: 5, agi: 5, int: 5,
                        hp: 100, maxHp: 100,
                        energy: 50, maxEnergy: 50,
                        xp: 0, maxXp: 100,
                        level: 1,
                        rank: 'Novice',
                        wins: 0
                    };
                    localStorage.setItem(`stats_${result.user.id}`, JSON.stringify(initialStats));
                }

                window.location.href = 'game.html';
            } catch (err) {
                showError('login', "Email ou mot de passe incorrect.");
                console.error(err);
            } finally {
                toggleLoader('login', false);
            }
        });
    }

    // --- REGISTER ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // Basic validation
            if (!data.username || !data.email || !data.password) {
                showError('register', "Tous les champs sont obligatoires.");
                return;
            }
            if (!validateEmail(data.email)) {
                showError('register', "Email invalide.");
                return;
            }

            toggleLoader('register', true);

            try {
                // Hash simple côté client
                data.password = btoa(data.password);

                await window.LeadGenRuntime.insertData('users', data);
                showError('register', "Compte créé avec succès ! Connectez-vous.", 'success');

                // Switch to login
                tabs[0].click();
                e.target.reset();
            } catch (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    showError('register', "Cet email est déjà utilisé.");
                } else {
                    showError('register', "Erreur lors de l'inscription.");
                }
                console.error(err);
            } finally {
                toggleLoader('register', false);
            }
        });
    }

    // --- HELPERS ---
    function showError(form, msg, type = 'error') {
        const div = document.getElementById(`${form}Error`);
        if (div) {
            div.textContent = msg;
            div.className = `error-msg ${type}`;
        } else {
            alert(msg);
        }
    }

    function toggleLoader(form, show) {
        const loader = document.getElementById(`${form}Loader`);
        if (loader) loader.style.display = show ? 'inline-block' : 'none';
    }

    function validateEmail(email) {
        return /^\S+@\S+\.\S+$/.test(email);
    }
}

// === GAME LOGIC ===
class SoulGame {
    constructor(user) {
        this.user = user;
        this.loadStats();
        this.currentStance = 'offensive';
        this.inCombat = false;
        this.enemy = null;
        this.transformed = false;
        
        this.initUI();
        this.startLoop();
        this.populateLeaderboard();
        this.simulateChat();
    }

    async loadStats() {
        try {
            const result = await window.LeadGenRuntime.executeSql(
                `SELECT * FROM game_stats WHERE user_id = ?`, 
                [this.user.id]
            );
            
            if (result.rows && result.rows.length > 0) {
                const dbStats = result.rows[0];
                this.stats = {
                    level: dbStats.level,
                    xp: dbStats.xp,
                    maxXp: dbStats.max_xp,
                    str: dbStats.str,
                    agi: dbStats.agi,
                    int: dbStats.int,
                    hp: dbStats.hp,
                    maxHp: dbStats.max_hp,
                    energy: dbStats.energy,
                    maxEnergy: dbStats.max_energy,
                    rank: dbStats.rank,
                    wins: dbStats.wins
                };
            } else {
                const savedStats = localStorage.getItem(`stats_${this.user.id}`);
                this.stats = savedStats ? JSON.parse(savedStats) : {
                    str: 5, agi: 5, int: 5,
                    hp: 100, maxHp: 100,
                    energy: 50, maxEnergy: 50,
                    xp: 0, maxXp: 100,
                    level: 1,
                    rank: 'Novice',
                    wins: 0
                };
            }
            this.updateStatsUI();
        } catch (e) {
            console.error("Erreur DB, utilisation du stockage local", e);
            const savedStats = localStorage.getItem(`stats_${this.user.id}`);
            this.stats = savedStats ? JSON.parse(savedStats) : {
                str: 5, agi: 5, int: 5, hp: 100, maxHp: 100, energy: 50, maxEnergy: 50, xp: 0, maxXp: 100, level: 1, rank: 'Novice', wins: 0
            };
            this.updateStatsUI();
        }
    }

    initUI() {
        document.getElementById('playerName').textContent = this.user.username;
        document.getElementById('playerRank').textContent = this.stats.rank;
        this.updateStatsUI();

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = btn.dataset.target;
                if (target) {
                    this.switchTab(target, btn);
                    if (target === 'missions') this.renderMissions();
                    if (target === 'skills') this.renderSkills();
                    if (target === 'clan') this.renderClan();
                } else if (btn.id === 'logoutBtn') {
                    localStorage.removeItem('soul_chronicles_user');
                    window.location.href = 'index.html';
                }
            });
        });

        document.getElementById('findMatchBtn').addEventListener('click', () => this.findMatch());
        document.getElementById('attackBtn').addEventListener('click', () => this.combatRound());
        document.getElementById('transformBtn').addEventListener('click', () => this.activateTransformation());
        
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addChatMessage(this.user.username, e.target.value, true);
                e.target.value = '';
            }
        });
    }

    // === (LE RESTE DE LA CLASSE SoulGame EST IDENTIQUE À TON FICHIER ORIGINAL) ===
    // Pour ne pas alourdir ce fichier, le code du combat, missions, skills, clan, leaderboard et chat reste inchangé.
    // Tu peux copier directement ton ancienne classe SoulGame ici.

}

function initGamePage(user) {
    window.game = new SoulGame(user);
    
    document.getElementById('playerAvatar').src = 'images/avatar.jpg';
    document.getElementById('combatPlayerImg').src = 'images/avatar.jpg';
}