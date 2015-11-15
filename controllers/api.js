var _ = require('lodash');
var secrets = require('../config/secrets');
var jwt = require('jwt-simple');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');

/**
 * POST /api/login
 * Sign in using email and password.
 */
exports.postLogin = function(req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password cannot be blank').notEmpty();

    var errors = req.validationErrors();

    if (errors) {
        res.json(errors); //return error and stop
        return;
    }

    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            return res.json(401, { error: info.message });
        }

        //user has authenticated correctly thus we create a JWT token
        var token = jwt.encode({ email: user.email}, secrets.jwt.secretOrKey);
        res.json({ token : token });

    })(req, res, next);
};

/**
 * POST /api/signup
 * Create a new local account.
 */
exports.postSignup = function(req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/signup');
    }

    var user = new User({
        email: req.body.email,
        password: req.body.password
    });

    User.findOne({ email: req.body.email }, function(err, existingUser) {
        if (existingUser) {
            req.flash('errors', { msg: 'Account with that email address already exists.' });
            return res.redirect('/signup');
        }
        user.save(function(err) {
            if (err) return next(err);
            req.logIn(user, function(err) {
                if (err) return next(err);
                res.redirect('/');
            });
        });
    });
};
