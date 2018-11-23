var meetingListUrl = "http://meeting.baidu.com/web/scheduleList?pageNo=1&dateStr=&buildingId=&roomName=";
var meetingCheckInUrl = "http://meeting.baidu.com/web/checkIn?scheduleId=";

var testUrl = "http://127.1.1.1/"
function testCheck() {
    console.log('run test function');
    var meetingList;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", testUrl, true);
    xhr.send();
    xhr.onreadystatechange = function() {
        console.log('status: ', xhr.readyState);
        if(xhr.readyState == 4) {
            meetingList = xhr.responseText.trim();
            console.log(meetingList);
        }
    }
}



// var t = self.setInterval(check,  10 * 60 * 1000)
// var t = self.setInterval(testCheck, 2 * 1000)
