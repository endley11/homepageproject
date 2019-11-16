var express = require('express');
var router = express.Router();

router.get('/', (req, res) => 
    res.render('signin', {
        message: req.flash('login_message')
    })

);

module.exports = router;