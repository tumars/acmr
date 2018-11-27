var meetingListUrl = "http://meeting.baidu.com/web/scheduleList?pageNo=1&dateStr=&buildingId=&roomName=";
var meetingCheckInUrl = "http://meeting.baidu.com/web/checkIn?scheduleId=";
// test url
// var meetingListUrl = "http://127.1.1.1/test.html"
// var meetingCheckInUrl = "http://127.1.1.1/index?scheduleId=";

var count = 0;
function check() {
    var htmlPage;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", meetingListUrl, true);
    xhr.send();
    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4) {
            htmlPage = xhr.responseText.trim();
            var checkInLink = $(htmlPage).find('#tab1 > table > tbody:nth-child(3) > tr > td:nth-child(11) > a:nth-child(1)');
            // console.log(checkInLink);
            var rooms = checkInLink.length;
            if (rooms !== 0) {
                for (var i = 0; i < rooms; i++){
                    // 链接文本用utf-16编码检查 签入
                    if (checkInLink[i].text === "签入" || checkInLink[i].text === "\u7B7E\u5165") {
                        console.info("Yeah, I found the meeting room need to check in...");

                        var clickevent = checkInLink[i].getAttribute('onclick');
                        var ids = clickevent.match(/[0-9]+/g);

                        if (clickevent.search('checkIn') > 0 && ids !== null) {
                            var url = meetingCheckInUrl + ids[0] + "&random=" + Math.random();
                            console.log(url);
                            $.ajax({
                                url: url,
                                async:true,
                                timeout: 4000
                            });
                            console.log("check in, dada~~");
                        }

                    }
                }
            }
            console.log('runtime: ', ++count);
        }
    }
}

var timer = self.setInterval(check, 10 * 60 * 1000);
// var timer = self.setInterval(check, 3 * 1000);
