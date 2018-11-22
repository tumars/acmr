var meetingListUrl = "http://meeting.baidu.com/web/scheduleList?pageNo=1&dateStr=&buildingId=&roomName=";
var meetingCheckInUrl = "http://meeting.baidu.com/web/checkIn?scheduleId=";

function check()  {
	//var meetingList = $.ajax({url: meetingListUrl, async: false}).responseText;
	var meetingList;
	var xhr = new XMLHttpRequest();
	xhr.open("GET", meetingListUrl, true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
		// WARNING! Might be evaluating an evil script!
		meetingList = xhr.responseText.trim();
		var checkInLink = $(meetingList).find(
		'#tab1 > table > tbody:nth-child(3) > tr > td:nth-child(11) > a:nth-child(1)' );
		//console.info(checkInLink);
		var rooms = checkInLink.length;
		if (rooms != 0) {
				for (var i = 0; i < rooms; i++){
						if (checkInLink[i].text == "签入") {
								console.info("Yeah, I found the meeting room need to check in...");
								
								var clickevent = checkInLink[i].getAttribute('onclick');
								var ids = clickevent.match(/[0-9]+/g);
								
								if (clickevent.search('checkIn') > 0 && ids != null) {
									var url = meetingCheckInUrl + ids[0] + "&random=" + Math.random();
									$.ajax({url: url, async:true});
								}
								console.info("check in, dada~~");
						}
				} 
		}
			
	  }
	}
	xhr.send();
	//console.info(meetingList);
	
	
	 //location.reload() ;
}

var t=self.setInterval(check,  10 * 60 * 1000)
 
