
let checkBtn = document.getElementById('check-now-btn');
let showNameBtn = document.getElementById('show-name-btn');

checkBtn.addEventListener('click', function() {
    // send message to background to check rooms immediatelly
    chrome.runtime.sendMessage({
        action: 'background-check-now'
    });
})

const urlTestReg = /^http(?:s|):\/\/meeting\.baidu\.com.*home.*/;
showNameBtn.addEventListener('click', function() {
    // send message to content scripts to change page style
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        let tab = tabs[0];
        if (urlTestReg.test(tab.url)) {
            chrome.tabs.executeScript(null, {file: 'content.js'});
        }
    })
})

window.onload = function() {
    // check cookies when open popup
    chrome.runtime.sendMessage({
        action: 'background-query-cookies-status'
    });
}

function setResultText({err, text, rooms}) {
    // console.log('print result in pop');
    // console.log(text);
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
    if (res.action === 'popup-cookies-checked') {
        const opt = {
            err: res.status > 0,
            text: res.status > 0 ? 'cookie checked fail' : '',
        };
        setResultText(opt)
    } else if (res.action === 'popup-rooms-checked') {
        const opt = {
            err: res.status > 0,
            text: res.message,
            rooms: res.rooms
        };
        setResultText(opt);
    }
})
