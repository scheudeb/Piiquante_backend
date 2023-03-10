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
    // Vérifie que l'utilisateur actuel est bien le propriétaire actuel de la sauce
    sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId !== req.auth.userId) {
                return res.status(401).json({ error: "Non autorisé" });
            }
            // Si l'utilisateur actuel est le propriétaire de la sauce, modifier la sauce
            const sauceObject = req.file
                ? {
                    ...JSON.parse(req.body.sauce),
                    imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
                }
                : { ...req.body };

            sauce.updateOne(
                { _id: req.params.id },
                { ...sauceObject, _id: req.params.id }
            )
                .then(() => res.status(200).json({ message: "Sauce modifiée !" }))

                .catch((error) => res.status(400).json({ error }));
        })
};

// Aimer ou ne pas aimer une sauce 

exports.likeSauce = (req, res, next) => {
    sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            // Vérifier si l'utilisateur a déjà liké ou disliké la sauce
            const userId = req.body.userId;
            const alreadyLiked = sauce.usersLiked.includes(userId);
            const alreadyDisliked = sauce.usersDisliked.includes(userId);

            if (req.body.like === 1) {  // J'aime
                if (!alreadyLiked) { // Si l'utilisateur n'a pas déjà liké la sauce
                    if (alreadyDisliked) { // Si l'utilisateur a déjà disliké la sauce, annuler le dislike
                        sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } })
                            .then(() => {
                                sauce.updateOne({ _id: req.params.id }, { $push: { usersLiked: userId }, $inc: { likes: +1 } })
                                    .then(() => res.status(200).json({ message: 'Like ajouté !' }))
                                    .catch(error => res.status(400).json({ error }));
                            })
                            .catch(error => res.status(400).json({ error }))
                    } else { // Ajouter le like
                        sauce.updateOne({ _id: req.params.id }, { $push: { usersLiked: userId }, $inc: { likes: +1 } })
                            .then(() => res.status(200).json({ message: 'Like ajouté !' }))
                            .catch(error => res.status(400).json({ error }));
                    }
                } else { // Si l'utilisateur a déjà liké la sauce, supprimer le like
                    sauce.updateOne({ _id: req.params.id }, { $pull: { usersLiked: userId }, $inc: { likes: -1 } })
                        .then(() => res.status(200).json({ message: 'Like supprimé !' }))
                        .catch(error => res.status(400).json({ error }))
                }


            } else if (req.body.like === -1) {  // Je n'aime pas
                if (!alreadyDisliked) { // Si l'utilisateur n'a pas déjà disliké la sauce
                    sauce.updateOne({ _id: req.params.id }, { $push: { usersDisliked: userId }, $inc: { dislikes: +1 } })
                        .then(() => res.status(200).json({ message: 'Dislike ajouté !' }))
                        .catch(error => res.status(400).json({ error }));
                } else if (req.body.like === 0) { // Si l'utilisateur a déjà disliké la sauce et souhaite changer son avis
                    sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } })
                        .then(() => res.status(200).json({ message: 'Dislike supprimé !' }))
                        .catch(error => res.status(400).json({ error }));
                } else { // Si l'utilisateur a déjà disliké la sauce, supprimer le like
                    sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } })
                        .then(() => res.status(200).json({ message: 'Dislike supprimé !' }))
                        .catch(error => res.status(400).json({ error }));
                }
            } else {  // Je n'ai plus d'avis
                if (alreadyLiked) { // Si l'utilisateur a déjà liké la sauce
                    sauce.updateOne({ _id: req.params.id }, { $pull: { usersLiked: userId }, $inc: { likes: -1 } })
                        .then(() => res.status(200).json({ message: 'Like supprimé !' }))
                        .catch(error => res.status(400).json({ error }))
                } else if (alreadyDisliked) { // Si l'utilisateur a déjà disliké la sauce
                    sauce.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: userId }, $inc: { dislikes: -1 } })
                        .then(() => res.status(200).json({ message: 'Dislike supprimé !' }))
                        .catch(error => res.status(400).json({ error }))
                } else {
                    res.status(400).json({ error: "Vous n'avez pas encore liké ou disliké cette sauce !" });
                }
            }
        })
        .catch(error => res.status(404).json({ error: "Sauce non trouvée !" }));
};
