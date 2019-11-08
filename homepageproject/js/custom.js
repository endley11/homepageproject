$(document).ready(function () {
    var apikey = "d8a2eae1f7940c8dec18aa7c64c64e6a";
    var url = "https://api.the-odds-api.com/v3/odds/?sport=UPCOMING&region=uk&mkt=h2h&apiKey=" + apikey;
    
    $('#btn1').click(function () {
//        $.ajax({
//            url: url,
//            type: 'get', // 전송방식
//            dataType: 'json', // 서버로부터 반환 받아올 데이터 형식
//            timeout: 10000, // 응답 제한 시간
//            success: function (xmlData) { // 성공시 실행할 콜백함수
//                console.log(xmlData);
//            },
//            error: function () {
//               
//            }
//        });
//    });
        fetch(url).then(function (response){
            response.json().then((data) =>{
                console.log(data);
                for(var i of data.data){
                    if(i.sport_nice == "EPL"){
                        console.log(i);
                        $(".home").text("홈 : " + i.teams[0]);
                        $(".away").text("어웨이 : " + i.teams[1]);
                        $(".odds").text("승 : " + i.sites[0].odds.h2h[0] + " 무 : " + i.sites[0].odds.h2h[1] + " 패 : " + i.sites[0].odds.h2h[2]);
                    }
                }
//                console.log(data.data);
            });
        });
    });
});
