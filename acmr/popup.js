
let checkBtn = document.getElementById('check-now-btn');

checkBtn.addEventListener('click', function() {
    console.log('check now');
    chrome.runtime.sendMessage({
        action: 'check-now'
    });
})

window.onload = function() {
    // check cookies when open popup
    chrome.runtime.sendMessage({
        action: 'query-cookies-status'
    });
}

function setResultText({err, text, rooms}) {
    let checkResult = document.getElementById('check-result');
    if (err) {
        checkResult.style.color = 'red';
        checkResult.style.fontWeight = 'bold';
    } else {
        checkResult.style.fontWeight = 'normal';
        checkResult.style.color = rooms && rooms > 0 ? '#96B97D' : 'black';
    }
    checkResult.innerText = text;
}


// background.js event listener
chrome.runtime.onMessage.addListener(function(res) {
    if (res.action === 'cookies-checked') {
        const opt = {
            err: res.status > 0,
            text: res.status > 0 ? 'cookie checked fail' : '',
        };
        setResultText(opt)
    } else if (res.action === 'rooms-checked') {
        const opt = {
            err: res.status > 0,
            text: res.message,
            rooms: res.rooms
        };
        setResultText(opt);
    }
})
