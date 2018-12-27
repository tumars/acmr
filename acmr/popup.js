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
            checkResult.innerText = String(checkRooms) + " rooms have been checked in.";
            checkResult.style.color = "#96B97D";
        } else {
            console.log('no rooms');
            checkResult.innerText = "No rooms need check now.";
            checkResult.style.color = "black";
        }
        checkResult.style.fontWeight = "normal";
        chrome.browserAction.setIcon({
            path: 'checkmark.png'
        });
    } else {
        // room check failed
        checkResult.innerText = request.data.info;
        checkResult.style.color = "red";
        checkResult.style.fontWeight = "bold";
        chrome.browserAction.setIcon({
            path: 'cross.png'
        });
    }
})
