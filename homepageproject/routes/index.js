const express = require("express");

const router = express.Router();
//라우터 객체 router는, get()함수를 이용해
//   /URL로 호출되었을 경우, 어떤 로직을 수행하도록 함 

const User = require('../models/user');
const mongoose = require('mongoose');
const crypto = require("crypto");
const passport = require('passport');
const flash = require('connect-flash');
const LocalStrategy = require('passport-local').Strategy;
var nodemailer = require('nodemailer');
var smtpTramsporter = require('nodemailer-smtp-transport');

passport.serializeUser(function (user,done){
    done(null,user);
});

passport.deserializeUser(function (user,done){
    done(null,user);
});

passport.use(new LocalStrategy({
        usernameField:'email',
        passwordField:'password',
        passReqToCallback:true
},
    function(req, email,password,done)
        {
            User.findOne({email:email,password:crypto.createHash('sha512').update(password).digest('base64')},function(err,user){
            if(err){
              
                
                throw err;
            } else if(!user){
                
                return done(null,false,req.flash('login_message','이메일 또는 비밀번호를 확인하세요.'));
                
            } else {
                return done(null,user);
                
            }
        });
    }
));


//라우터 객체 router는, 

router.get('/index',(req,res) =>
    res.render('index',{message:req.flash('login_message')})
    
);

router.post('/index',passport.authenticate('local',{failureRedirect:'/index',failureFlash:true}),
        function(req,res){
    res.redirect('/login');
});


router.get('/login',(req, res) =>
   res.render('login', {message: req.flash('login_message')})
   
);

router.post('/login', passport.authenticate('local',{failureRedirect:'/login',failureFlash:true}),
           function(req,res){
            res.redirect('/');
});



router.get('/logout', function(req,res){
    req.logout();
    res.redirect('/index');
});

router.post("/signup", (req,res,next) => {
    console.log(req.body);
    User.find({email:req.body.email})
    .exec()
    .then(user => {
        if(user.length >= 1){
            res.send('<script type="text/javascript">alert("이미 존재하는 이메일입니다.");window.location="/signup";</script>');
        } else{
            const user = new User({
                _id: new mongoose.Types.ObjectId(),
                name:req.body.name,
                email:req.body.email,
                password:crypto.createHash('sha512').update(req.body.password).digest('base64')
            });
            user.save().then(result => {
                console.log(result);
                res.redirect("/index");
            })
            .catch(err => {
                console.log(err);
            });
            
        } 
});
});

router.get('/index', (req,res) => res.render('index'));
router.get("/login", (req,res) => res.render("login",{page:"login"}));
router.get("/signup", (req,res) => res.render("signup",{page:"signup"}));

module.exports = router;