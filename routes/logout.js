var express = require('express');
var router = express.Router();

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/signin');
    res.send('로그아웃 되었습니다.');
});