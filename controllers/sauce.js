const fs = require('fs');
const Sauce = require('../models/sauce');

exports.getAllSauces = (req, res, next) => {
    Sauce.find().then(
        (sauces) => {
            res.status(200).json(sauces);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({
        _id: req.params.id
    }).then(
        (sauce) => {
            res.status(200).json(sauce);
        }
    ).catch(
        (error) => {
            res.status(404).json({
                error: error
            });
        }
    );
};

// Fonction permettant de vérifier le format d'un nom (Sauce, Pepper, Manufacturer, etc.)
function checkName(name) {
    const nameRegEx = new RegExp(/^[a-zA-Z]+([-\s]?[a-zA-Z]+)*$/gi);
    return nameRegEx.test(name);
}

exports.createSauce = (req, res, next) => {
    let sauce = null;
    if (req.body.sauce) {
        const sauceObject = JSON.parse(req.body.sauce);
        delete sauceObject._id;
        delete sauceObject._userId;
        sauce = new Sauce({
            ...sauceObject,
            userId: req.auth.userId,
            imageUrl: req.file.filename ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : '',
            _id: req.params.id
        });
    } else {
        sauce = new Sauce({
            ...req.body
        }
        );
    }
    if (!checkName(sauce.name) || !checkName(sauce.manufacturer)) {
        res.status(400).json({
            error: "Certaines données n'ont pas le format attendu."
        });
    }
    else {
        sauce.save().then(
            () => {
                res.status(201).json({
                    message: 'Sauce saved successfully!'
                });
            }
        ).catch(
            (error) => {
                res.status(400).json({
                    error: error
                });
            }
        );
    }
};



exports.modifySauce = (req, res, next) => {
    Sauce.findOne({
        _id: req.params.id
    }).then(
        (sauce) => {
            if (sauce.userId === req.auth.userId) {
                let sauceUpdated = null;
                let delImg = false;
                if (req.body.sauce) {
                    const sauceObject = JSON.parse(req.body.sauce);
                    delete sauceObject._id;
                    delete sauceObject._userId;
                    delImg=true;
                    sauceUpdated = new Sauce({
                        ...sauceObject,
                        userId: req.auth.userId,
                        imageUrl: req.file.filename ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : '',
                        _id: req.params.id
                    });

                } else {
                    sauceUpdated = new Sauce({
                        ...req.body, _id: req.params.id
                    }
                    );
                }
                if (!checkName(sauceUpdated.name) || !checkName(sauceUpdated.manufacturer)) {
                    deleteSauceImage(sauceUpdated.imageUrl);
                    res.status(400).json({
                        error: "Certaines données n'ont pas le format attendu."
                    });
                } else {
                    Sauce.updateOne({ _id: req.params.id }, sauceUpdated)
                        .then(
                            () => {
                                deleteSauceImage(sauce.imageUrl);
                                res.status(201).json({
                                    message: 'Sauce updated successfully!'
                                });
                            }
                        ).catch(
                            (error) => {
                                res.status(400).json({
                                    error: error
                                });
                            }
                        );
                }
            }
            else {
                res.status(403).json({ message: "Vous ne pouvez pas modifier cette sauce !" });
            }
        }
    ).catch(
        (error) => {
            res.status(404).json({
                error: error
            });
        }
    );
}

exports.modifySauceLike = (req, res, next) => {
    Sauce.findOne({
        _id: req.params.id
    }).then(
        (sauce) => {
            const userId = req.body.userId;
            const like = req.body.like;

            switch (like) {
                case 1:
                    if (!sauce.usersLiked.includes(userId)) {
                        sauce.usersLiked.push(userId);
                    }
                    break;
                case 0:
                    sauce.usersLiked.remove(userId);
                    sauce.usersDisliked.remove(userId);
                    break;
                case -1:
                    if (!sauce.usersDisliked.includes(userId)) {
                        sauce.usersDisliked.push(userId);
                    }

                    break;
            }

            sauce.likes = sauce.usersLiked.length;
            sauce.dislikes = sauce.usersDisliked.length;

            Sauce.updateOne({ _id: req.params.id }, sauce).then(
                () => {
                    res.status(201).json({
                        message: 'Sauce updated successfully!'
                    });
                }
            ).catch(
                (error) => {
                    res.status(400).json({
                        error: error
                    });
                }
            );
        }
    ).catch(
        (error) => {
            res.status(404).json({
                error: error
            });
        }
    );
}

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({
        _id: req.params.id
    }).then(sauce => {

        deleteSauceImage(sauce.imageUrl);

        Sauce.deleteOne({ _id: req.params.id }).then(
            () => {
                res.status(200).json({
                    message: 'Deleted!'
                });
            }
        ).catch(
            (error) => {
                res.status(400).json({
                    error: error
                });
            }
        );
    }
    ).catch(
        (error) => {
            res.status(404).json({
                error: error
            });
        }
    );
};

function deleteSauceImage(imageUrl) {
    const imgPath = `${process.cwd()}/images/${(imageUrl.split('/images/'))[1]}`;
    fs.unlink(imgPath, (err) => {
        if (err) { console.log('Image non supprimée : ' + err); }
        else { console.log(`Image ${imgPath} supprimée !`); }
    });
}