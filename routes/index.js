const express = require('express');
const router = express.Router();
const Post = require('../models/post');

// router.get('/',  (req, res) => {res.render('index')});

router.get('/', async(req, res) => {
    res.redirect('/users/load-hompage')
});

router.get('/index', (req, res) =>
    res.render('index', {
        user: req.user
    })
);

module.exports = router;