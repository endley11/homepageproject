const request = require('request');
const cheerio = require('cheerio');


var options = {
    url: 'https://www.soccerstats.com/leaguepreviews.asp?league=england&pmtype=homeaway',
    method: 'POST',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.146 Whale/2.6.88.11 Safari/537.36',
    }
};

request(options, (error, response, body) => {
    try{
        var match = [];
        
        var $ = cheerio.load(body);
        var list = $('#content > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td > table:nth-child(3) > tbody > .trow2');
        console.log(list.length)
        
        for(var i=0; i< list.length;i++){
            home = list.eq(i).find('td:nth-child(4)').text();
            date = list.eq(i).find('td:nth-child(1) > b').text();
            url = list.eq(i).find('#StatsBarBtn > a').attr("href");
            away = list.eq(++i).find('td:nth-child(2)').text();
            
            
            match.push({
                home : home.split('\n')[1],
                away : away.split('\n')[1],
                url : url,
                date : date.split('\n')[1]
            });
        }
        console.log(match);
    } catch (error) {
        console.log(error);
    }

});
