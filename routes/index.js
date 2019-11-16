const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);
const router = express.Router();
const fs = require('fs');
//라우터 객체 router는, get()함수를 이용해
//   /URL로 호출되었을 경우, 어떤 로직을 수행하도록 함 
const socket = require('socket.io');
const io = socket(server)
const User = require('../models/user');
const mongoose = require('mongoose');
const crypto = require("crypto");
const passport = require('passport');
const flash = require('connect-flash');
const LocalStrategy = require('passport-local').Strategy;
var nodemailer = require('nodemailer');
var path = require('path');
var smtpTramsporter = require('nodemailer-smtp-transport');
const request = require('request-promise');
const cheerio = require('cheerio');
var teamnameApiSoccerstat = require("../teams");



passport.serializeUser(function (user, done) {
    console.log(user)
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    console.log('desrializeUser', user)
    done(null, user);
});

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function (req, email, password, done) {
        User.findOne({
            email: email,
            password: crypto.createHash('sha512').update(password).digest('base64')
        }, function (err, user) {
            if (err) {


                throw err;
            } else if (!user) {

                return done(null, false, req.flash('login_message', '이메일 또는 비밀번호를 확인하세요.'));

            } else {

                return done(null, user, req.flash('login_message',  '로그인에 성공하셨습니다'));


            }
        });
    }
));

router.get('/chat',(req,res) =>{
    fs.readFile('./public/chat.html',function(err,data){
        if(err){
            res.send('에러')
        }else{
            res.writeHead(200,{'Content-Type':'text/html'})
            res.write(data)
            res.end()
        }
    })
    
});

io.sockets.on('connection',function(socket){
     console.log('hd')
    socket.on('newUser', function(name){
       console.log(name + ' 님이 접속하였습니다.')
       
       socket.name = name
       
       io.sockets.emit('update',{type:'connect',name:'SERVER',message: name + '님이 접속하였습니다.'})
   })
    
    socket.on('message',function(data){
        data.name = socket.name
        
        console.log(data)
        
        socket.broadcast.emit('update',data);
    })
    
    socket.on('disconnect',function(){
        console.log(socket.name + ' 님이 나가셨습니다.')
        
        socket.broadcast.emit('update',{type: 'disconnect', name:'SERVER',message:socket.name + '님이 나가셨습니다.'});
    })
    });





router.get('/signin', (req, res) =>
    res.render('signin', {
        message: req.flash('login_message')
    })
    

);


router.post('/signin', passport.authenticate('local', {
        failureRedirect: '/signin',
        failureFlash: true
    }),
    function (req, res) {
        res.redirect('/signed_in');
    });


router.get('/signed_in', (req, res) =>

    res.render('signed_in', {
        message: req.flash('login_message')
    })


);


router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/signin');
    res.send('로그아웃 되었습니다.');
});

router.post("/signup", (req, res, next) => {
    console.log(req.body);
    User.find({
            email: req.body.email
        })
        .exec()
        .then(user => {
            if (user.length >= 1) {
                res.send('<script type="text/javascript">alert("이미 존재하는 이메일입니다.");window.location="/signup";</script>');
            } else {
                const user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    name: req.body.name,
                    email: req.body.email,
                    password: crypto.createHash('sha512').update(req.body.password).digest('base64')
                });
                user.save().then(result => {
                        console.log(result);
                        res.redirect("/signin");
                    })
                    .catch(err => {
                        console.log(err);
                    });

            }
        });
});


var matches = [];
var matchstat = {};
var leagueFixtures = [];
var leagueOdds = [];

router.get('/epl',
    function (req, res, next) {
        var options = {
            uri: 'https://www.soccerstats.com/leaguepreviews.asp?league=england&pmtype=homeaway',
            transform: function (body) {
                return cheerio.load(body);
            },
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.146 Whale/2.6.88.13 Safari/537.36"
            }
        };
        request(options).then(($) => {
            matches = [];
            var list = $('#content > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > table:nth-child(3) > tbody > .trow2');

            for (var i = 0; i < list.length; i++) {
                home = list.eq(i).find('td:nth-child(4)').text();
                date = list.eq(i).find('td:nth-child(1) > b').text();
                uid = list.eq(i).find('#StatsBarBtn > a').attr("href");
                away = list.eq(++i).find('td:nth-child(2)').text();
                homeApi = "";

                uid.substr(uid.indexOf("stats=") + 6)

                // API와 SoccerStat에서 받아오는 팀명이 다르므로 API상의 팀 명을 따로 지정해주는 작업.
                teamnameApiSoccerstat.epl.forEach((e) => {
                    if (home == e[0])
                        homeApi = e[1]
                });

                matches.push({
                    league: "england",
                    home: home.split('\n')[1],
                    away: away.split('\n')[1],
                    uid: uid.substr(uid.indexOf("stats=") + 6),
                    date: date.split('\n')[1],
                    homeApi: homeApi
                });
            }

            res.render("league", {
                data: matches
            });
            //            next();

        }).catch((err) => {
            console.log(err);
        })

    },
   

);
router.get('/laliga',
    function (req, res, next) {
        var options = {
            uri: 'https://www.soccerstats.com/leaguepreviews.asp?league=spain&pmtype=homeaway',
            transform: function (body) {
                return cheerio.load(body);
            },
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.146 Whale/2.6.88.13 Safari/537.36"
            }
        };
        request(options).then(($) => {
            matches = [];
            var list = $('#content > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > table:nth-child(3) > tbody > .trow2');

            for (var i = 0; i < list.length; i++) {
                home = list.eq(i).find('td:nth-child(4)').text();
                date = list.eq(i).find('td:nth-child(1) > b').text();
                uid = list.eq(i).find('#StatsBarBtn > a').attr("href");
                away = list.eq(++i).find('td:nth-child(2)').text();
                homeApi = "";

                uid.substr(uid.indexOf("stats=") + 6)

                // API와 SoccerStat에서 받아오는 팀명이 다르므로 API상의 팀 명을 따로 지정해주는 작업.
                teamnameApiSoccerstat.epl.forEach((e) => {
                    if (home == e[0])
                        homeApi = e[1]
                });

                matches.push({
                    league: "spain",
                    home: home.split('\n')[1],
                    away: away.split('\n')[1],
                    uid: uid.substr(uid.indexOf("stats=") + 6),
                    date: date.split('\n')[1],
                    homeApi: homeApi
                });
            }

            res.render("league", {
                data: matches
            });

        }).catch((err) => {
            console.log(err);
        })

    }
);

router.get('/bundesliga',
    function (req, res, next) {
        var options = {
            uri: 'https://www.soccerstats.com/leaguepreviews.asp?league=germany&pmtype=homeaway',
            transform: function (body) {
                return cheerio.load(body);
            },
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.146 Whale/2.6.88.13 Safari/537.36"
            }
        };
        request(options).then(($) => {
            matches = [];
            var list = $('#content > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > table:nth-child(3) > tbody > .trow2');

            for (var i = 0; i < list.length; i++) {
                home = list.eq(i).find('td:nth-child(4)').text();
                date = list.eq(i).find('td:nth-child(1) > b').text();
                uid = list.eq(i).find('#StatsBarBtn > a').attr("href");
                away = list.eq(++i).find('td:nth-child(2)').text();
                homeApi = "";

                uid.substr(uid.indexOf("stats=") + 6)

                // API와 SoccerStat에서 받아오는 팀명이 다르므로 API상의 팀 명을 따로 지정해주는 작업.
                teamnameApiSoccerstat.epl.forEach((e) => {
                    if (home == e[0])
                        homeApi = e[1]
                });

                matches.push({
                    league: "germany",
                    home: home.split('\n')[1],
                    away: away.split('\n')[1],
                    uid: uid.substr(uid.indexOf("stats=") + 6),
                    date: date.split('\n')[1],
                    homeApi: homeApi
                });
            }

            res.render("league", {
                data: matches
            });

        }).catch((err) => {
            console.log(err);
        })

    }
);

router.get('/seriea',
    function (req, res, next) {
        var options = {
            uri: 'https://www.soccerstats.com/leaguepreviews.asp?league=italy&pmtype=homeaway',
            transform: function (body) {
                return cheerio.load(body);
            },
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.146 Whale/2.6.88.13 Safari/537.36"
            }
        };
        request(options).then(($) => {
            matches = [];
            var list = $('#content > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > table:nth-child(3) > tbody > .trow2');

            for (var i = 0; i < list.length; i++) {
                home = list.eq(i).find('td:nth-child(4)').text();
                date = list.eq(i).find('td:nth-child(1) > b').text();
                uid = list.eq(i).find('#StatsBarBtn > a').attr("href");
                away = list.eq(++i).find('td:nth-child(2)').text();
                homeApi = "";

                uid.substr(uid.indexOf("stats=") + 6)

                // API와 SoccerStat에서 받아오는 팀명이 다르므로 API상의 팀 명을 따로 지정해주는 작업.
                teamnameApiSoccerstat.epl.forEach((e) => {
                    if (home == e[0])
                        homeApi = e[1]
                });

                matches.push({
                    league: "italy",
                    home: home.split('\n')[1],
                    away: away.split('\n')[1],
                    uid: uid.substr(uid.indexOf("stats=") + 6),
                    date: date.split('\n')[1],
                    homeApi: homeApi
                });
            }

            res.render("league", {
                data: matches
            });

        }).catch((err) => {
            console.log(err);
        })

    }
);
router.get('/ligue1',
    function (req, res, next) {
        var options = {
            uri: 'https://www.soccerstats.com/leaguepreviews.asp?league=france&pmtype=homeaway',
            transform: function (body) {
                return cheerio.load(body);
            },
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.146 Whale/2.6.88.13 Safari/537.36"
            }
        };
        request(options).then(($) => {
            matches = [];
            var list = $('#content > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > table:nth-child(3) > tbody > .trow2');

            for (var i = 0; i < list.length; i++) {
                home = list.eq(i).find('td:nth-child(4)').text();
                date = list.eq(i).find('td:nth-child(1) > b').text();
                uid = list.eq(i).find('#StatsBarBtn > a').attr("href");
                away = list.eq(++i).find('td:nth-child(2)').text();
                homeApi = "";

                uid.substr(uid.indexOf("stats=") + 6)

                // API와 SoccerStat에서 받아오는 팀명이 다르므로 API상의 팀 명을 따로 지정해주는 작업.
                teamnameApiSoccerstat.epl.forEach((e) => {
                    if (home == e[0])
                        homeApi = e[1]
                });

                matches.push({
                    league: "france",
                    home: home.split('\n')[1],
                    away: away.split('\n')[1],
                    uid: uid.substr(uid.indexOf("stats=") + 6),
                    date: date.split('\n')[1],
                    homeApi: homeApi
                });
            }

            res.render("league", {
                data: matches
            });

        }).catch((err) => {
            console.log(err);
        })

    }
);
router.get('/eredivisie',
    function (req, res, next) {
        var options = {
            uri: 'https://www.soccerstats.com/leaguepreviews.asp?league=netherlands&pmtype=homeaway',
            transform: function (body) {
                return cheerio.load(body);
            },
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.146 Whale/2.6.88.13 Safari/537.36"
            }
        };
        request(options).then(($) => {
            matches = [];
            var list = $('#content > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > table:nth-child(3) > tbody > .trow2');

            for (var i = 0; i < list.length; i++) {
                home = list.eq(i).find('td:nth-child(4)').text();
                date = list.eq(i).find('td:nth-child(1) > b').text();
                uid = list.eq(i).find('#StatsBarBtn > a').attr("href");
                away = list.eq(++i).find('td:nth-child(2)').text();
                homeApi = "";

                uid.substr(uid.indexOf("stats=") + 6)

                // API와 SoccerStat에서 받아오는 팀명이 다르므로 API상의 팀 명을 따로 지정해주는 작업.
                teamnameApiSoccerstat.epl.forEach((e) => {
                    if (home == e[0])
                        homeApi = e[1]
                });

                matches.push({
                    league: "netherlands",
                    home: home.split('\n')[1],
                    away: away.split('\n')[1],
                    uid: uid.substr(uid.indexOf("stats=") + 6),
                    date: date.split('\n')[1],
                    homeApi: homeApi
                });
            }

            res.render("league", {
                data: matches
            });

        }).catch((err) => {
            console.log(err);
        })

    }
);

router.use('/matchstat', function (req, res, next) {
        var uid = req.query.uid;
        var league = req.query.league;
        var options = {
            uri: 'https://www.soccerstats.com/pmatch.asp?league=' + league + '&stats=' + uid,
            transform: function (body) {
                return cheerio.load(body);
            },
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.146 Whale/2.6.88.13 Safari/537.36"
            }
        };
        request(options).then(($) => {
            matchstat = {};
            matchstat.home = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(3) > tbody > tr.trow2 > td:nth-child(1) > h2').text();
            matchstat.away = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(3) > tbody > tr.trow2 > td:nth-child(3) > h2').text();
            matchstat.homeHomeGP = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(2) > td:nth-child(2) > font').text();
            matchstat.homeHomeWin = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(2) > td:nth-child(3) > font > b').text();
            matchstat.homeHomeDraw = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(2) > td:nth-child(4) > font > b').text();
            matchstat.homeHomeLose = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(2) > td:nth-child(5) > font > b').text();
            matchstat.awayAwayGP = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(2) > td:nth-child(7) > font').text();
            matchstat.awayAwayWin = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(2) > td:nth-child(8) > font > b').text();
            matchstat.awayAwayDraw = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(2) > td:nth-child(9) > font > b').text();
            matchstat.awayAwayLose = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(2) > td:nth-child(10) > font > b').text();
            matchstat.homeTotalGP = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(3) > td:nth-child(2)').text();
            matchstat.homeTotalWin = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(3) > td:nth-child(3)').text();
            matchstat.homeTotalDraw = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(3) > td:nth-child(4)').text();
            matchstat.homeTotalLose = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(3) > td:nth-child(5)').text();
            matchstat.awayTotalGP = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(3) > td:nth-child(7)').text();
            matchstat.awayTotalWin = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(3) > td:nth-child(8)').text();
            matchstat.awayTotalDraw = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(3) > td:nth-child(9)').text();
            matchstat.awayTotalLose = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(5) > tbody > tr:nth-child(3) > td:nth-child(10)').text();
            var homeTable = [];
            var awayTable = [];
            var hometablelist = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(10) > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td > table > tbody > tr');
            var awaytablelist = $('#content > div:nth-child(6) > div > div.five.columns > table:nth-child(10) > tbody > tr > td:nth-child(3) > table > tbody > tr:nth-child(2) > td > table > tbody > tr');

            for (var i = 1; i < hometablelist.length; i++) {
                var hometableElement = {};
                hometableElement.teamname = hometablelist.eq(i).find('td:nth-child(2)').text().split('\n')[1];
                hometableElement.gameplayed = hometablelist.eq(i).find('td:nth-child(3) > font').text();
                hometableElement.point = hometablelist.eq(i).find('td:nth-child(4) > b').text();
                var awaytableElement = {};
                awaytableElement.teamname = awaytablelist.eq(i).find('td:nth-child(2)').text().split('\n')[1];
                awaytableElement.gameplayed = awaytablelist.eq(i).find('td:nth-child(3) > font').text();
                awaytableElement.point = awaytablelist.eq(i).find('td:nth-child(4) > b').text();

                homeTable.push(hometableElement);
                awayTable.push(awaytableElement);
            }
            matchstat.homeTable = homeTable;
            matchstat.awayTable = awayTable;


            var h2hMatch = [];
            var h2hMatchlist = $('#content > div:nth-child(6) > div > div.seven.columns > table:nth-child(41) > tbody > tr:nth-child(3) > td > table > tbody > tr');
            for (var i = 0; i < h2hMatchlist.length; i++) {
                var h2hMatchElement = {};
                h2hMatchElement.date = h2hMatchlist.eq(i).find('td:nth-child(1) > font').text();
                h2hMatchElement.home = h2hMatchlist.eq(i).find('td:nth-child(2)').text().split(' - ')[0];
                h2hMatchElement.away = h2hMatchlist.eq(i).find('td:nth-child(2)').text().split(' - ')[1];
                h2hMatchElement.score = h2hMatchlist.eq(i).find('td:nth-child(3) > b').text();

                h2hMatch.push(h2hMatchElement);
            }
            matchstat.h2hMatch = h2hMatch;

            var h2h = {
                win: $('#content > div:nth-child(6) > div > div.seven.columns > table:nth-child(41) > tbody > tr:nth-child(4) > td > table > tbody > tr:nth-child(1) > td:nth-child(2) > font > b').text(),
                draw: $('#content > div:nth-child(6) > div > div.seven.columns > table:nth-child(41) > tbody > tr:nth-child(4) > td > table > tbody > tr:nth-child(2) > td:nth-child(2) > font > b').text(),
                lose: $('#content > div:nth-child(6) > div > div.seven.columns > table:nth-child(41) > tbody > tr:nth-child(4) > td > table > tbody > tr:nth-child(3) > td:nth-child(2) > font > b').text()
            }
            matchstat.h2h = h2h;

            var leagueTable = [];
            var last8Table = [];
            var leaguetablelist = $('#container > div.row > table:nth-child(1) > tbody > tr:nth-child(1) > td > table:nth-child(2) > tbody > tr > td:nth-child(1) > table > tbody > tr');
            var last8tablelist = $('#container > div.row > table:nth-child(1) > tbody > tr:nth-child(1) > td > table:nth-child(2) > tbody > tr > td:nth-child(2) > table > tbody > tr');
            for (var i = 2; i < leaguetablelist.length; i++) {
                var leaguetableElement = {};
                leaguetableElement.teamname = leaguetablelist.eq(i).find('td:nth-child(2)').text();
                leaguetableElement.gameplayed = leaguetablelist.eq(i).find('td:nth-child(3) > font').text();
                leaguetableElement.point = leaguetablelist.eq(i).find('td:nth-child(4) > b').text();
                var last8tableElement = {};
                last8tableElement.teamname = last8tablelist.eq(i).find('td:nth-child(2)').text();
                last8tableElement.gameplayed = last8tablelist.eq(i).find('td:nth-child(3) > font').text();
                last8tableElement.point = last8tablelist.eq(i).find('td:nth-child(4) > b').text();

                leagueTable.push(leaguetableElement);
                last8Table.push(last8tableElement);
            }
            matchstat.leagueTable = leagueTable;
            matchstat.last8Table = last8Table;
            
            var recentTable = [];
            var recentlist = $('#content > div:nth-child(6) > div.row > div.seven.columns > table:nth-child(2) > tbody > tr');
            for (var i = 0; i < recentlist.length-1; i++) {
                var recentElement = {};
                recentElement.homescore = recentlist.eq(i).find('td:nth-child(3) > font > b').text();
                recentElement.awayscore = recentlist.eq(i).find('td:nth-child(5) > font > b').text();
                recentTable.push(recentElement);
            }
            
            req.recentTable = recentTable;            
            req.othermatchesLink = $('#content > div:nth-child(6) > div.row > div.seven.columns > table:nth-child(3) > tbody > tr > td > span > a').attr('href');
            
            
            next();

        }).catch((err) => {
            console.log(err);
        })
    },
    function (req, res, next) {
        var options = {
            uri: 'https://www.soccerstats.com/' + req.othermatchesLink,
            transform: function (body) {
                return cheerio.load(body);
            },
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.146 Whale/2.6.88.13 Safari/537.36"
            }
        };
        request(options).then(($) => {
            
           
        
            var homeRecentTable = [];
            var homeRecentlist = $('#content > div:nth-child(7) > div:nth-child(1) > table:nth-child(6) > tbody > tr');
            for(var i = homeRecentlist.length, count = 0;count < 8;i--) {
                if(homeRecentlist.eq(i).attr('bgcolor') == '#FFFFBF' || homeRecentlist.eq(i).attr('bgcolor') == '#FFCACA' || homeRecentlist.eq(i).attr('bgcolor') == '#D7EFBE'){
                    
                var homeRecentElement = {};
                homeRecentElement.date = homeRecentlist.eq(i).find('td:nth-child(1) > font').text().split('\n')[1];
                homeRecentElement.home = homeRecentlist.eq(i).find('td:nth-child(2) > b').text() == "" ?
                homeRecentlist.eq(i).find('td:nth-child(2)').text().split('\n')[1] :
                homeRecentlist.eq(i).find('td:nth-child(2) > b').text().split('\n')[1];
                homeRecentElement.away = homeRecentlist.eq(i).find('td:nth-child(4) > b').text() == "" ?
                homeRecentlist.eq(i).find('td:nth-child(4)').text().split('\n')[1] : 
                homeRecentlist.eq(i).find('td:nth-child(4) > b').text().split('\n')[1];

                homeRecentTable.push(homeRecentElement);
                    count++;
                }
            }
            var awayRecentTable = [];
            var awayRecentlist = $('#content > div:nth-child(7) > div:nth-child(2) > table:nth-child(6) > tbody > tr');
             for(var i = awayRecentlist.length, count = 0;count < 8;i--) {
                if(awayRecentlist.eq(i).attr('bgcolor') == '#FFFFBF' || awayRecentlist.eq(i).attr('bgcolor') == '#FFCACA' || awayRecentlist.eq(i).attr('bgcolor') == '#D7EFBE'){
                    
                var awayRecentElement = {};
                awayRecentElement.date = awayRecentlist.eq(i).find('td:nth-child(1) > font').text().split('\n')[1];
                awayRecentElement.home = awayRecentlist.eq(i).find('td:nth-child(2) > b').text() == "" ?
                awayRecentlist.eq(i).find('td:nth-child(2)').text().split('\n')[1] :
                awayRecentlist.eq(i).find('td:nth-child(2) > b').text().split('\n')[1];
                awayRecentElement.away = awayRecentlist.eq(i).find('td:nth-child(4) > b').text() == "" ?
                awayRecentlist.eq(i).find('td:nth-child(4)').text().split('\n')[1] :
                awayRecentlist.eq(i).find('td:nth-child(4) > b').text().split('\n')[1];

                awayRecentTable.push(awayRecentElement);
                    count++;
                }
            }
            req.recentTable.forEach((e,i) => {
                homeRecentTable[i].score = e.homescore;
                awayRecentTable[i].score = e.awayscore;
            })
            matchstat.homeRecentTable = homeRecentTable;
            matchstat.awayRecentTable = awayRecentTable;
            
            
            
            res.render("matchstat", {
                matchstat: matchstat
            });
            
        }).catch((err) =>{
            console.log(err);
        })
    }
);





router.get('/', (req, res) => res.render("index"));
router.get('/signed_in', (req, res) => res.render('signed_in'),{page:'signed_in'});

/*
router.get("/login", (req, res) => res.render("login", {
    page: "login"
}));

*/
router.get("/signup", (req, res) => res.render("signup", {
    page: "signup"
}));


module.exports = router;
