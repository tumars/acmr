var meetingListUrl = "http://meeting.baidu.com/web/scheduleList?pageNo=1&dateStr=&buildingId=&roomName=";
var meetingCheckInUrl = "http://meeting.baidu.com/web/checkIn?scheduleId=";

// check website cookies
function validCookie(checkRoomsAction) {
    chrome.cookies.get({
        url: "http://meeting.baidu.com/",
        name: "JSESSIONID"
    }, function(cookie) {
        if (cookie) {
            if (typeof checkRoomsAction === "function") {
                checkRoomsAction();
            }
        } else {
            chrome.runtime.sendMessage({
                checked: false,
                data: {info: "Missing cookies, please login first."}
            });
        }

    })
}

// check room factory function
var runtime = 0;
function checkRoomsAction(sendMess) {
    return function() {
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
                var checkRooms = 0;
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
                                console.log("send check in request, dada~~");
                            }
                            checkRooms++;
                        }
                    }
                }
                if (typeof sendMess === 'function') {
                    sendMess(checkRooms);
                }
                console.log('runtime: ', ++runtime);
            }
        }
    }
}

// main check action
function check() {
    validCookie(
        checkRoomsAction(
            function(checkRooms) {
                chrome.runtime.sendMessage({checked:true, data: {checkRooms: checkRooms}});
    }))
}

// check immediately
chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.chekNow === true) {
        check();
    }
})

// valide cookies
validCookie()
var timer = self.setInterval(check, 10 * 60 * 1000);
