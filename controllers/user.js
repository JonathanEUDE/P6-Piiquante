const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passwordValidator = require('password-validator');
// Create a schema
const schema = new passwordValidator();
schema
    .is().min(8)                                    // Minimum length 8
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits(1)                                // Must have at least 1 digits
    .has().not().spaces()                           // Should not have spaces

const User = require('../models/user');


// Fonction permettant de vérifier le format d'un mail.
function checkEmail(mail) {
    const emailRegEx = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,6})+$/gi);
    return emailRegEx.test(mail);
}

exports.signup = (req, res, next) => {
    if (!checkEmail(req.body.email)) {
        res.status(400).json({
            error: "L'email n'a pas un format valide."
        });
    } else {
        let passValidate = schema.validate(req.body.password, { details: true });
        if (passValidate.length > 0) {
            res.status(400).json({
                error: passValidate
            });
        } else {
            bcrypt.hash(req.body.password, 10)
                .then(hash => {
                    const user = new User({
                        email: req.body.email,
                        password: hash
                    });
                    user.save().then(
                        () => {
                            res.status(201).json({
                                message: 'User saved successfully!'
                            });
                        }
                    ).catch(
                        (error) => {
                            res.status(400).json({
                                error: error
                            });
                        }
                    );
                })
                .catch(error => res.status(500).json({ error }));
        }
    }
}

exports.login = (req, res, next) => {
    User.findOne({
        email: req.body.email
    }).then(
        (user) => {
            if (user === null) {
                res.status(401).json({ message: "Paire identifiant / mot de passe incorrecte" })
            }
            else {
                bcrypt.compare(req.body.password, user.password)
                    .then((valid) => {
                        if (valid) {
                            console.log(`Connexion validée, userId : ${user._id}`);
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id },
                                    process.env.TOKEN_SECRET,
                                    { expiresIn: '24h' }
                                )
                            });
                        } else {
                            res.status(401).json({ message: "Paire identifiant / mot de passe incorrecte" });
                        }
                    })
                    .catch(error => {
                        res.status(500).json({ error });
                    });
            }
        }
    ).catch(
        (error) => {
            res.status(500).json({
                error
            });
        }
    );
}