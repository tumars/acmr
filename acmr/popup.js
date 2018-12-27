var checkResult = document.getElementById('check-result');
var checkBtn = document.getElementById('check-now-btn');

checkBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({chekNow: true});
})



// listen room check status
chrome.runtime.onMessage.addListener(function(request) {
    console.log(request);
    if (request.checked) {
        // room check success
        var checkRooms = request.data.checkRooms;
        if (checkRooms > 0) {
            checkResult.innerText = `Check in ${String(checkRooms)} rooms.`;
            checkResult.style.color = "#96B97D";
        } else {
            // console.log('no rooms');
            checkResult.innerText = "No rooms need to check.";
            checkResult.style.color = "black";
        }
        checkResult.style.fontWeight = "normal";
        chrome.browserAction.setIcon({
            path: 'success.png'
        });
    } else {
        // room check failed
        checkResult.innerText = request.data.info;
        checkResult.style.color = "red";
        checkResult.style.fontWeight = "bold";
        chrome.browserAction.setIcon({
            path: 'fail.png'
        });
    }
})
