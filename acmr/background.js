const meetingListUrl = "http://meeting.baidu.com/web/scheduleList?pageNo=1&dateStr=&buildingId=&roomName=";
const meetingCheckInUrl = "http://meeting.baidu.com/web/checkIn?scheduleId=";

const SUCCESS = 0, FAIL_REQUEST = 1, FAIL_TIMEOUT = 2, FAIL_COOKIE = 3;

// check website cookies
function checkCookies() {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({
            domain: 'meeting.baidu.com'
        }, function(cookies) {
            if (cookies.length > 2) {
                // cookies check success: login status
                resolve({cookieCheckStatus: true});
            } else {
                // cookies check failed: logout status
                reject({cookieCheckStatus: false, status: FAIL_COOKIE, message: 'cookie checked fail'});
            }
        });
    });
}

function checkRooms(res) {
    const cookieCheckStatus = res.cookieCheckStatus;
    return new Promise((resolve, reject) => {
        if (cookieCheckStatus) {
            let htmlPage;
            let xhr = new XMLHttpRequest();
            xhr.open('GET', meetingListUrl, true);
            xhr.send();
            // 请求成功
            xhr.onreadystatechange = function(e) {
                try {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        htmlPage = xhr.responseText.trim();
                        let checkInLink = $(htmlPage).find('#tab1 > table > tbody:nth-child(3) > tr > td:nth-child(11) > a:nth-child(1)');
                        const rooms = checkInLink.length;
                        let checkedRooms = 0;
                        if (rooms !== 0) {
                            for (let i = 0; i < rooms; i++) {
                                // 链接文本用utf-16编码检查 签入
                                if (checkInLink[i].text === "签入" || checkInLink[i].text === "\u7B7E\u5165") {
                                    console.log("# Yeah, I found the meeting room need to check in...");
                                    let clickevent = checkInLink[i].getAttribute('onclick');
                                    let ids = clickevent.match(/[0-9]+/g);
                                    if (clickevent.search('checkIn') > 0 && ids !== null) {
                                        let url = meetingCheckInUrl + ids[0] + "&random=" + Math.random();
                                        console.log(url);
                                        $.ajax({
                                            url: url,
                                            async: true,
                                            timeout: 4000
                                        });
                                        console.log("# send check in request, dada~~");
                                    }
                                    checkedRooms++;
                                }
                            }
                        }
                        resolve({
                            cookieCheckStatus,
                            requestStatus: true,
                            status: SUCCESS,
                            rooms: checkedRooms
                        });
                    } else if (xhr.readyState === 4 && xhr.status !== 200) {
                        throw {
                            cookieCheckStatus: true,
                            requestStatus: false,
                            status: FAIL_REQUEST,
                            message: `Request error: ${xhr.status}`
                        };
                    }
                } catch (err) {
                    reject(err)
                }
            };
            xhr.onerror = function (e) {
                console.log(e);
                reject({cookieCheckStatus, requestStatus: false, status: 1, message: 'Request error'});
            };
            xhr.ontimeout = function() {
                reject({cookieCheckStatus, requestStatus: false, status: 2, message: 'Request timeout'});
            };
        }
    });
}

function successResponse(res) {
    // console.log('successRes')
    // console.log(res)
    let {cookieCheckStatus, requestStatus, rooms, status} = res;
    if (cookieCheckStatus && requestStatus) {
        chrome.browserAction.setIcon({
            path: 'success.png'
        });
        chrome.runtime.sendMessage({
            action: 'popup-rooms-checked',
            status: SUCCESS,
            message: rooms > 0 ? `Checked ${rooms} rooms` : 'No rooms need to check.',
            rooms
        });
        return {status: 0, rooms};
    }
}

function failResponse(err) {
    console.log('!!-fail Response:-!!')
    console.log(err);
    let {message, status} = err;
    chrome.browserAction.setIcon({
        path: 'fail.png'
    });
    
    chrome.runtime.sendMessage({
        action: 'popup-rooms-checked',
        status: status || 3,
        message: message || 'request failed!'
    });
    return {status, message};
}

// main check action
let runtime = 0;
function checkMain() {
    checkCookies().then(checkRooms).then(successResponse).catch(failResponse).then(res => {
        if (res.status > 0) {
            console.log(`${new Date().toLocaleString()}--runtime: ${++runtime}\n--${res.message}`);
        } else {
            console.log(`${new Date().toLocaleString()}--runtime: ${++runtime}\n--checked ${res.rooms} room(s)`);
        }
    })
}

function queryCookieStatus() {
    checkCookies()
    .then(
        function(res) {
            return {action: 'popup-cookies-checked', status: 0};
        },
        function(res) {
            return {action: 'popup-cookies-checked', status: 1};
        }
    )
    .then(res => {
        // console.log('cookie checked');
        chrome.browserAction.setIcon({
            path: res.status > 0 ? 'fail.png' : 'success.png'
        });

        chrome.runtime.sendMessage(res);
        if (res.status > 0) {
            console.log(`${new Date().toLocaleString()}--query cookie status\n-- failed`);
        } else {
            console.log(`${new Date().toLocaleString()}--query cookie status\n-- success`);
        }
    })
}

let timer;
function randomInvoke() {
    let base = 8 + Math.random() * 6;
    timer = setTimeout(function invoke() {
        checkMain();
        base = 8 + Math.random() * 6;
        timer = setTimeout(invoke, base * 60 * 1000)
    }, base * 60 * 1000)
}
// start to work
randomInvoke();

// action from popup
chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action === 'background-check-now') {
        if (timer) {
            timer = null;
        }
        checkMain();
        randomInvoke();
        timer = setInterval(checkMain, 10 * 60 * 1000);
    } else if (request.action === 'background-query-cookies-status') {
        queryCookieStatus();
    }
});
