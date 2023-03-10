// Ajout d'Express
const express = require('express');

const path = require('path');
const helmet = require("helmet");


// Ajout des routes
const saucesRoutes = require('./routes/sauce');
const userRoutes = require('./routes/user');

// création de l'appli express
const app = express();

// ajout du middleware express.json afin d'extraire le corps JSON pour la requête POST
app.use(express.json());

// Connexion à la base de données 
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

// Contourner les erreurs de CORS 
app.use((req, res, next) => {
    // utilise l'accès à l'API depuis n'importe quel port
    res.setHeader('Access-Control-Allow-Origin', '*');
    // ajout des headers aux requêtes envoyées à l'API 
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    // ajout des méthodes pour envoyer des requêtes
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    next();
});
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use('/api/sauces', saucesRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

// exportation de l'application express
module.exports = app;
