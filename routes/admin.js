const express = require("express");
const router = express.Router();
const controller = require('../controllers/app-admin.js');
router.get('/dashboard', controller.getUsers)
router.get('/approve-user/:id', controller.approveExpert)
router.get('/discard-user/:id', controller.discardExpert)

// Actual admin tasks :-(
router.get('/all-tests', controller.allTests)
router.get('/create-test', (req, res) => {
    res.render('createTest')
})
router.post('/create-test', controller.createTest)
router.get('/single-test/:id', controller.singleTest)
router.get('/search-test', controller.searchTests)
router.get('/get-question/:id', controller.getQuestion)
router.get('/edit-test/:id', controller.getEditTest)
router.post('/edit-test', controller.postEditTest)
module.exports = router;

// http://bad-blogger.herokuapp.com/admin/reset_password