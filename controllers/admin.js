const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const randomString = require('randomstring');
const nodemailer = require('nodemailer');
// Load User model
const { gUser } = require('../models/gUser');
const { eUser } = require('../models/eUser')
const testModel = require('../models/test')
const Post = require('../models/post');
const Comment = require('../models/comment');
var mongoose = require('mongoose');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', function(callback) {
    console.log('Successfully connected to MongoDB.');
});
const Schema = mongoose.Schema;


// Get login page
module.exports.get_login = (req, res) => {
    res.render('login');
};
// Post login page
const onSuccess = (user, device) => {
    console.log(user)
    if (device == 'android') {
        return '/'
    } else {
        if (user) {
            return '/'
        } else {
            return '/admin/login'
        }
    }
}
module.exports.post_login = (req, res, next) => {
        console.log(req.body)
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/admin/login',
            failureFlash: true
        })(req, res, next);
    }
    //Quick Login: safwan.du167@gmail.com, home761049
module.exports.AndroidLogin = async(req, res, next) => {
    console.log(req.body)
    if (req.user) {
        return res.send({
            status: true,
            user: req.user,
            msg: 'Logged in'
        })
    }
}

module.exports.androidLogin = async(req, res) => {
    let user = await gUser.findOne({ email: req.body.email })
    if (user) {
        let gmatch = await bcrypt.compare(req.body.password, user.password)
        if (gmatch) {
            req.user = user
            res.send({
                user,
                msg: 'Logged in'
            })
        } else {
            res.send({
                user: null,
                msg: 'Incorrect password'
            })
        }
    } else {
        user = await eUser.findOne({ email: req.body.email })
        if (user) {
            let ematch = await bcrypt.compare(req.body.password, user.password)
            if (user.isVerified == true && ematch) {
                req.user = user
                res.send({
                    user,
                    msg: 'Logged in'
                })
            } else if (!user.isVerified) {
                res.send({
                    user: null,
                    msg: 'Your expert account is pending for admin approval'
                })
            } else {
                res.send({
                    user: null,
                    msg: 'Incorrect password'
                })
            }
        } else {
            res.send({
                user: null,
                msg: 'Email not found'
            })
        }
    }
}

// Get register page 
module.exports.get_register = (req, res) => { res.render('register') }
    // Post register page
module.exports.postRegGen = async(req, res, next) => {
    const {
        name,
        email,
        phoneNumber,
        password
    } = req.body
    const dupEmail = await gUser.findOne({ email: email })
    const dupPhone = await gUser.findOne({ phoneNumber: phoneNumber })
    if (dupEmail) {
        return res.send({
            status: false,
            msg: 'Email already used'
        })
    } else if (dupPhone) {
        return res.send({
            status: false,
            msg: 'Phone number already used'
        })
    }

    const hashed = await bcrypt.hash(password, 10)
    const userObj = {
        name,
        phoneNumber,
        email,
        password: hashed
    }

    const newGenUser = new gUser(userObj)
        // console.log(newGenUser)
    await newGenUser.save()
    console.log('general saved')

    const { diaryModel } = require('../models/diary.js')
    const { stressModel } = require('../models/stressors.js')

    const userDiary = {
        owner_id: newGenUser._id,
        owner_name: newGenUser.name,
        records: []
    }
    const diary = new diaryModel(userDiary)
    await diary.save()

    const userStress = {
        owner_id: newGenUser._id,
        owner_name: newGenUser.name,
        records: []
    }
    const stress = new stressModel(userStress)
    await stress.save()

    return res.send({
        status: true,
        msg: 'okke'
    })
}

module.exports.googleRegGen = async(req, res) => {
    const GoogleStrategy = require('passport-google-oauth20').Strategy
    console.log('in')
    passport.use(new GoogleStrategy({
            clientID: '887125122883-jsba3nm3r7pei13lttvh9bvoifu4vbot.apps.googleusercontent.com',
            clientSecret: 'EuXF134L9w84RETN3Eo3yYlJ',
            callbackURL: '/auth/google/redirect'
        },
        async(accessToken, refreshToken, profile, cb) => {
            console.log(profile);
        }
    ));
}

module.exports.postRegExp = async(req, res, next) => {
    const {
        name,
        email,
        phoneNumber,
        organization,
        designation,
        password,
        city,
        country,
        hDegree,
        institute,
        field,
        license
    } = req.body

    const dupEmail = await eUser.findOne({ email: email })
    const dupPhone = await eUser.findOne({ phoneNumber: phoneNumber })
    if (dupEmail) {
        return res.send({
            status: false,
            msg: 'Email already used'
        })
    } else if (dupPhone) {
        console.log(dupPhone)
        return res.send({
            status: false,
            msg: 'Phone number already used'
        })
    }

    const hashed = await bcrypt.hash(password, 10)
    const residence = {
        city,
        country
    }
    const education = {
        hDegree,
        institute,
        field
    }
    const userObj = {
        name,
        email,
        organization,
        phoneNumber,
        designation,
        password: hashed,
        residence,
        education
    }
    const newExpUser = new eUser(userObj)
        // console.log(newExpUser)
    await newExpUser.save()
    console.log('expert saved')
    return res.send({
        status: true,
        msg: 'okke'
    })

}

// Logout
module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    const { device } = req.query
    if (device == 'android') {
        res.send({
            status: true,
            msg: 'Logged out'
        })
    }
    res.redirect('/admin/login');
}

//Forgot password page
module.exports.get_forgot_password = (req, res) => {
    res.render('forgot_password');
};

module.exports.post_forgot_password = async(req, res) => {
    const { userType, email } = req.body
    let user
    if (userType == 'general') {
        user = await gUser.findOne({ email: email })
    } else {
        user = await eUser.findOne({ email: email })
    }
    if (!user) {
        return res.send({
            status: false,
            msg: 'Email not found'
        })
    } else {
        // sendResetLink(email, userType)
        const { passwordResetMail } = require('../config/sendMail.js')
        passwordResetMail(email, userType)
        return res.send({
            status: true,
            msg: 'A link has been sent to the email you provided.'
        })
    }
}

function sendResetLink(email, type) {
    var Transport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "safwan.du16@gmail.com",
            pass: "Home-761049"
        }
    });
    var rand, mailOptions, host, link;
    let sender = 'admin@badblogger.com';
    let port = 3000;
    mailOptions = {
        from: sender,
        to: email,
        subject: "badBlogger : Password Reset",
        html: `Seems like you just forgot your password :-( , it happens :-)<br>Click on the link to reset your password.<br><a href="http://bad-blogger.herokuapp.com/admin/reset_password?email=${email}&usertype=${type}"><b>Reset Page</b></a> <br> Nice day!`
    }
    console.log(mailOptions);

    Transport.sendMail(mailOptions, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log("Message sent");
        }
    });
}

module.exports.get_reset_password = async(req, res) => {
    const {
        email,
        usertype
    } = req.query
    console.log('get_reset_password - ', email);
    req.flash('okay');
    res.render('reset_password', {
        email,
        usertype
    });
}

module.exports.post_reset_password = async(req, res) => {
    const {
        password,
        confirmPassword,
        email,
        usertype
    } = req.body
    console.log(req.body)
    const hashed = await bcrypt.hash(password, 10)
    if (usertype == 'general') {
        await gUser.findOneAndUpdate({ email: email }, {
            $set: {
                password: hashed
            }
        })
    } else {
        await eUser.findOneAndUpdate({ email: email }, {
            $set: {
                password: hashed
            }
        })
    }
    return res.send({
        status: true,
        msg: 'okke'
    })
}


// actual admin tasks :-(