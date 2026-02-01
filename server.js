const express = require('express');
const path = require('path');
const app = express();

// Middleware pour lire les données POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir les fichiers statiques (index.html, game.html, main.js, images)
app.use(express.static(path.join(__dirname)));

// Définir le port Render ou local
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));