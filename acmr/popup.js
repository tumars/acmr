
const checkBtn = document.getElementById('check-now-btn');
const loginBtn = document.getElementById('login-btn');
const checkResult = document.getElementById('check-result');
const roomList = document.getElementById('room-list');
const controlBtn = document.getElementById('control')


checkResult.success = function (text) {
    this.style.color = '#67c23a';
    this.style.backgroundColor = '#f0f9eb';
    this.innerText = text;
};

checkResult.error = function (text) {
    this.style.color = '#f56c6c';
    this.style.backgroundColor = '#fef0f0';
    this.innerText = text;
};

checkResult.clear = function () {
    this.style.backgroundColor = '#fff';
    this.innerText = '';
};



roomList.setList = function ({canCheckInRooms, needCheckInRooms}) {
    let list1 = canCheckInRooms.length > 0 
        ? `
            <ul class="can-check">
            ${canCheckInRooms.map(({roomName}) => 
                `<li><span><img src="./ok.png">${roomName}</span></li>
                `
            ).join('')}
            </ul>
        ` 
        : '';
    let list2 = needCheckInRooms.length > 0
        ? `
            <ul class="need-check">
            ${needCheckInRooms.map(({roomName, startTimeStr}) => 
                `<li><span><img src="./wait.png">${roomName}</span><span>${startTimeStr}</span></li>
                `
            ).join('')}
            </ul>
        `
        : '';
    this.innerHTML = list1 + list2;
};


checkBtn.addEventListener('click', function() {
    if (!this.getAttribute('disable')) {
        chrome.runtime.sendMessage({
            action: 'background-check-now'
        });
    }
});

controlBtn.addEventListener('click', function() {
    const status = this.getAttribute('data-status');
    switch (status) {
        case 'run': {
            this.setAttribute('data-status', 'stop');
            checkBtn.setAttribute('disabled', true);
            checkResult.error('auto service stopped.');
            chrome.runtime.sendMessage({
                action: 'background-stop-now'
            });
        }
        break;
        default: {
            this.setAttribute('data-status', 'run');
            checkBtn.removeAttribute('disabled');
            checkResult.success('auto service restarted.')
            chrome.runtime.sendMessage({
                action: 'background-restart-now'
            });
        }
    }
});


// background.js event listener
chrome.runtime.onMessage.addListener(function(res) {
    if (res.action === 'popup-rooms-checked') {
        const {status, message, rooms} = res;
        if (status === 0) {
            checkResult.success(message);
            roomList.setList(rooms);
        }
        else {
            checkResult.error(message);
        }
        
        status === 3 
            ? (loginBtn.style.display = 'block') 
            : (loginBtn.style.display = 'none');
    }
});


// chrome.runtime.sendMessage({
//     action: 'background-check-status'
// }, ({status}) => {
//     alert(status)
//     if (status === 'pause') {
//         controlBtn.setAttribute('data-status', 'stop');
//         checkBtn.setAttribute('disabled', true);
//         checkResult.error('auto service stopped!');
//     }
// });

chrome.storage.sync.get(['isStopTimer'], (res) => {
    if (res.isStopTimer) {
        controlBtn.setAttribute('data-status', 'stop');
        checkBtn.setAttribute('disabled', true);
        checkResult.error('auto service stopped!');
    }
});