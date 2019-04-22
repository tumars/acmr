const meetingListUrl = 'http://meeting.baidu.com/h5/getUnfinishScheduleByUser';
const meetingCheckInUrl = 'http://meeting.baidu.com/web/checkIn';

const SUCCESS = 0,
    FAIL_REQUEST = 1,
    FAIL_TIMEOUT = 2,
    FAIL_LOGIN = 3;

const failNotifyId = 'fail_info_notify';
let loginFailFromMe = false;
// main check action
let timer;
let runtime = 0;
let isStopTimer = false;



async function fetchRoomList() {
    let url = `${meetingListUrl}?t=${Date.now()}`;

    try {
        const res = await fetch(url, {
            credentials: 'include'  
        });
        if (res.status !== 200) {
            return await Promise.reject({
                message: `Fail to get the room list! request error: ${res.status}`
            });
        }

        if (res.redirected && /uuap.baidu.com\/login/g.test(res.url)) {
            loginFailFromMe = true;
            return await Promise.reject({
                status: FAIL_LOGIN,
                message: 'UUAP login fail!'
            });
        }
        
        loginFailFromMe = false;
        const data = await res.json();
        return data.data.list;
    } catch (err) {
        return await Promise.reject({
            requestStatus: false,
            status: err.status || FAIL_REQUEST,
            message: err.message || `Fail to get the room list, request error!`,
        });
    }
};

async function fetchCheckIn(roomId) {
    let url = `${meetingCheckInUrl}?scheduleId=${roomId}&random=${Math.random()}`;
    try {
        const res = await fetch(url, {
            credentials: 'include'  
        });

        if (res.status !== 200) {
            return await Promise.reject({
                message: `Fail to checkin the room, request error: ${res.status}`
            });
        }
        
        return {
            checkInStatus: SUCCESS
        };
    } catch (err) {
        return await Promise.reject({
            rrequestStatus: false,
            status: FAIL_REQUEST,
            message: err.message || `Fail to checkin the room, request error!`,
            err
        });
    } 
};


function handleList(list) {
    let roomList = list.reduce(function (resultArr, item) {
        // status_field   havn't_start  can_check_in  hava_checked_in
        // canCancel      1             1             0
        // canCheckIn     0             1             0
        // canCheckOut    0             0             1
        // canTransfer    1             1             0
        if (item.isNeedCheckIn) {
            resultArr.push(item);
        }
        return resultArr;
    }, []);
    // rooms which can check in right now
    let canCheckInRooms = roomList.filter(item => item.canCheckIn);
    // rooms need check in future
    let needCheckInRooms = roomList.filter(item => !item.canCheckIn && item.canCancel);
    return {
        needCheckInRooms,
        canCheckInRooms
    };
};


function successResponse(rooms) {
    chrome.browserAction.setIcon({
        path: 'success.png'
    });
    const checkLen = rooms.canCheckInRooms.length;
    chrome.runtime.sendMessage({
        action: 'popup-rooms-checked',
        status: SUCCESS,
        message: checkLen > 0 ? `Checked ${checkLen} rooms` : 'No rooms need to check.',
        rooms
    });

    console.log(`${new Date().toLocaleString()}--runtime: ${++runtime}\n--checked ${checkLen} room(s)`);

    if (checkLen > 0) {
        chrome.notifications.create(null, {
            type: 'basic',
            iconUrl: 'success.png',
            title: `${rooms.canCheckInRooms.map(({roomName}) => roomName)} already chenck-in!`,
            message: 'Meeting Room Auto CheckIn!'
        });
    };
};

function failResponse({status, message}) {
    chrome.browserAction.setIcon({
        path: 'fail.png'
    });

    chrome.runtime.sendMessage({
        action: 'popup-rooms-checked',
        status: status || 1,
        message: message || 'request failed!'
    });

    console.log(`${new Date().toLocaleString()}--runtime: ${++runtime}\n--${message}`);

    chrome.notifications.clear(failNotifyId, () => {
        chrome.notifications.create(failNotifyId, {
            type: 'basic',
            iconUrl: 'fail.png',
            title: `Meeting Auto CheckIn Fail!`,
            message,
            requireInteraction: true
        });
    });
};



async function checkMain() {
    try {
        const rooms = handleList(await fetchRoomList());
        const {canCheckInRooms} = rooms;
        const checkPrArr = canCheckInRooms.map(item => {
            return fetchCheckIn(item.id);
        });
        await Promise.all(checkPrArr);
        successResponse(rooms);
    } catch (err) {
        const {status, message} = err;
        failResponse({
            status,
            message
        });
    }
};


function randomInvoke() {
    let base = 8 + Math.random() * 6;
    timer = setTimeout(function invoke() {
        checkMain();
        base = 8 + Math.random() * 6;
        timer = setTimeout(invoke, base * 60 * 1000)
    }, base * 60 * 1000);
    chrome.storage.sync.set({isStopTimer: false});
}


chrome.storage.sync.get(['isStopTimer'], (res) => {
    if (res.isStopTimer) {
        chrome.browserAction.setIcon({
            path: 'pause.png'
        });
    } 
    else {
        randomInvoke();
    }
});


// action from popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
        case 'background-check-now':
            checkMain();
            break;
        case 'background-stop-now':
            chrome.browserAction.setIcon({
                path: 'pause.png'
            });
            clearTimeout(timer);
            chrome.storage.sync.set({isStopTimer: true});
            break;
        case 'background-restart-now':
            chrome.browserAction.setIcon({
                path: 'success.png'
            });
            randomInvoke();
            break;
    }
});

chrome.notifications.onClicked.addListener(function (id) {
    if (id === failNotifyId) {
        chrome.notifications.clear(failNotifyId);
        chrome.tabs.create({
            url: 'http://meeting.baidu.com/#/home'
        });
    }
});

chrome.webRequest.onBeforeRedirect.addListener(function (details) {
    const {initiator, redirectUrl} = details;
    if (loginFailFromMe && /uuap.baidu.com/g.test(initiator) && /meeting.baidu.com/g.test(redirectUrl)) {
        checkMain();
    }
}, {urls: ["*://meeting.baidu.com/*"]},
["responseHeaders"]);
