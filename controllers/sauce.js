const sauce = require('../models/sauce');
const fs = require('fs');

// Créer une sauce 
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId;
    const sauceCreate = new sauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: [],
    });

    sauceCreate.save()
        .then(() => { res.status(201).json({ message: 'Objet enregistré !' }) })
        .catch(error => { res.status(400).json({ error }) })
};

// Récupérer une sauce
exports.getSauce = (req, res, next) => {
    sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            res.status(200).json(sauce);
        })
        .catch((error) => {
            res.status(400).json({
                error: error,
            });
        });
};
// Récupérer toutes les sauces
exports.getAllSauces = (req, res, next) => {
    sauce.find()
        .then((sauces) => {
            res.status(200).json(sauces);
        })
        .catch((error) => {
            res.status(400).json({
                error: error,
            });
        });
};

// Supprimer une sauce
exports.deleteSauce = (req, res, next) => {
    sauce.findOne({ _id: req.params.id })
        .then(thing => {
            if (thing.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = thing.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    sauce.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

// Modifier une sauce

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file
        ? {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename
                }`,
        }
        : { ...req.body };
    sauce.updateOne(
        { _id: req.params.id },
        { ...sauceObject, _id: req.params.id }
    )
        .then(() => res.status(200).json({ message: "Sauce modifiée !" }))

        .catch((error) => res.status(400).json({ error }));
};
// Aimer ou ne pas aimer une sauce 

exports.likeSauce = (req, res, next) => {
    if (req.body.like === 1) {  // J'aime
        sauce.updateOne({ _id: req.params.id }, { $push: { usersLiked: req.body.userId }, $inc: { likes: +1 } })
            .then(() => res.status(200).json({ message: 'Like ajouté !' }))
            .catch(error => res.status(400).json({ error }));
    } else if (req.body.like === -1) {  // Je n'aime pas
        sauce.updateOne({ _id: req.params.id }, { $push: { usersDisliked: req.body.userId }, $inc: { dislikes: +1 } })
            .then(() => res.status(200).json({ message: 'Dislike ajouté !' }))
            .catch(error => res.status(400).json({ error }));
    } else {  // Je n'ai plus d'avis
        sauce.findOne({ _id: req.params.id })
            .then(sauce => {
                if (sauce.usersLiked.includes(req.body.userId)) {
                    sauce.updateOne({ _id: req.params.id }, { $pull: { usersLiked: req.body.userId }, $inc: { likes: -1 } })
                        .then(() => res.status(200).json({ message: 'Like supprimé !' }))
                        .catch(error => res.status(400).json({ error }))
                } else if (sauce.usersDisliked.includes(req.body.userId)) {
                    sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: req.body.userId }, $inc: { dislikes: -1 } })
                        .then(() => res.status(200).json({ message: 'Dislike supprimé !' }))
                        .catch(error => res.status(400).json({ error }))
                }
            })
            .catch(error => res.status(400).json({ error }));
    }
};