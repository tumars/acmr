const meetingListUrl = 'http://meeting.baidu.com/h5/getUnfinishScheduleByUser';
const meetingCheckInUrl = 'http://meeting.baidu.com/web/checkIn';
// 签入地址
// http://meeting.baidu.com/h5/checkInByRoomAndUser?scheduleId=24880663&roomId=7026142&t=1547610367403

const SUCCESS = 0,
    FAIL_REQUEST = 1,
    FAIL_TIMEOUT = 2,
    FAIL_COOKIE = 3;

// check website cookies
function checkCookies() {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({
            domain: 'meeting.baidu.com'
        }, function (cookies) {
            if (cookies.length > 2) {
                // cookies check success: login status
                resolve({
                    cookieCheckStatus: true
                });
            } else {
                // cookies check failed: logout status
                reject({
                    cookieCheckStatus: false,
                    status: FAIL_COOKIE,
                    message: 'cookie checked fail'
                });
            }
        });
    });
}

function sendCheckInRequest(roomId) {
    return new Promise((resolve, reject) => {
        let url = `${meetingCheckInUrl}?scheduleId=${roomId}&random=${Math.random()}`;
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send();
        xhr.onreadystatechange = function (e) {
            try {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    resolve({
                        checkInStatus: SUCCESS
                    });
                } else if (xhr.readyState === 4 && xhr.status !== 200) {
                    console.log(`Check fail ${url}`);
                    throw Error(`Fail to checkin the room, request error: ${xhr.status}`);
                }
            } catch (err) {
                reject({
                    checkInStatus: FAIL_REQUEST,
                    roomId,
                    err,
                });
            }
        };
        xhr.onerror = function (e) {
            console.log(e);
            reject({
                checkInStatus: FAIL_REQUEST,
                roomId,
                message: 'Fail to checkin the room, request error'
            });
        };
        xhr.ontimeout = function () {
            reject({
                checkInStatus: FAIL_TIMEOUT,
                roomId,
                message: 'Fail to checkin the room, request timeout'
            });
        };
    });
}

function checkRooms(res) {
    const cookieCheckStatus = res.cookieCheckStatus;
    return new Promise((resolve, reject) => {
        if (cookieCheckStatus) {
            let xhr = new XMLHttpRequest();
            let url = `${meetingListUrl}?t=${Date.now()}`;
            xhr.open('GET', url, true);
            xhr.responseType = 'json';
            xhr.send();
            xhr.onreadystatechange = function (e) {
                try {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        let json = xhr.response;
                        let roomList = json.data.list.reduce(function (resultArr, item) {
                            // 会议室状态字段   未开始  可签入  已签入
                            // canCancel      1      1      0
                            // canCheckIn     0      1      0
                            // canCheckOut    0      0      1
                            // canTransfer    1      1      0
                            if (item.isNeedCheckIn) {
                                resultArr.push({
                                    id: item.id,
                                    startTime: item.startTime,
                                    startTimeStr: item.startTimeStr,
                                    canCancel: item.canCancel,
                                    canCheckIn: item.canCheckIn,
                                    canCheckOut: item.canCheckOut,
                                    canTransfer: item.canTransfer
                                });
                            }
                            return resultArr;
                        }, []);
                        // 可签入房间
                        let canCheckInRooms = roomList.filter(item => item.canCheckIn);
                        // 待签入房间
                        let needCheckInRooms = roomList.filter(item => !item.canCheckIn && item.canCancel);
                        console.log(`## <${canCheckInRooms.length}> rooms can check in right now. <${needCheckInRooms.length}> rooms need check in.`)
                        let checkPrArr = canCheckInRooms.map(item => {
                            return sendCheckInRequest(item.id);
                        });
                        Promise.all(checkPrArr).then(() => {
                            resolve({
                                cookieCheckStatus,
                                requestStatus: true,
                                status: SUCCESS,
                                rooms: canCheckInRooms.length
                            });
                        }, () => reject);
                    } else if (xhr.readyState === 4 && xhr.status !== 200) {
                        throw Error(`Fail to get the room list, request error: ${xhr.status}`);
                    }
                } catch (err) {
                    console.log(err);
                    reject({
                        cookieCheckStatus,
                        requestStatus: false,
                        status: FAIL_REQUEST,
                        err
                    });
                }
            };
            xhr.onerror = function (e) {
                console.log(e);
                reject({
                    cookieCheckStatus,
                    requestStatus: false,
                    status: FAIL_REQUEST,
                    message: 'Fail to get the room list, request error'
                });
            };
            xhr.ontimeout = function () {
                reject({
                    cookieCheckStatus,
                    requestStatus: false,
                    status: FAIL_TIMEOUT,
                    message: 'Fail to get the room list, request timeout'
                });
            };
        }
    });
}

// function checkRooms(res) {
//     const cookieCheckStatus = res.cookieCheckStatus;
//     return new Promise((resolve, reject) => {
//         if (cookieCheckStatus) {
//             let htmlPage;
//             let xhr = new XMLHttpRequest();
//             xhr.open('GET', meetingListUrl, true);
//             xhr.send();
//             // 请求成功
//             xhr.onreadystatechange = function (e) {
//                 try {
//                     if (xhr.readyState === 4 && xhr.status === 200) {
//                         htmlPage = xhr.responseText.trim();
//                         let checkInLink = $(htmlPage).find('#tab1 > table > tbody:nth-child(3) > tr > td:nth-child(11) > a:nth-child(1)');
//                         const rooms = checkInLink.length;
//                         let checkedRooms = 0;
//                         if (rooms !== 0) {
//                             for (let i = 0; i < rooms; i++) {
//                                 // 链接文本用utf-16编码检查 签入
//                                 if (checkInLink[i].text === "签入" || checkInLink[i].text === "\u7B7E\u5165") {
//                                     console.log("# Yeah, I found the meeting room need to check in...");
//                                     let clickevent = checkInLink[i].getAttribute('onclick');
//                                     let ids = clickevent.match(/[0-9]+/g);
//                                     if (clickevent.search('checkIn') > 0 && ids !== null) {
//                                         let url = meetingCheckInUrl + ids[0] + "&random=" + Math.random();
//                                         console.log(url);
//                                         $.ajax({
//                                             url: url,
//                                             async: true,
//                                             timeout: 4000
//                                         });
//                                         console.log("# send check in request, dada~~");
//                                     }
//                                     checkedRooms++;
//                                 }
//                             }
//                         }
//                         resolve({
//                             cookieCheckStatus,
//                             requestStatus: true,
//                             status: SUCCESS,
//                             rooms: checkedRooms
//                         });
//                     } else if (xhr.readyState === 4 && xhr.status !== 200) {
//                         throw {
//                             cookieCheckStatus: true,
//                             requestStatus: false,
//                             status: FAIL_REQUEST,
//                             message: `Request error: ${xhr.status}`
//                         };
//                     }
//                 } catch (err) {
//                     reject(err)
//                 }
//             };
//             xhr.onerror = function (e) {
//                 console.log(e);
//                 reject({
//                     cookieCheckStatus,
//                     requestStatus: false,
//                     status: 1,
//                     message: 'Request error'
//                 });
//             };
//             xhr.ontimeout = function () {
//                 reject({
//                     cookieCheckStatus,
//                     requestStatus: false,
//                     status: 2,
//                     message: 'Request timeout'
//                 });
//             };
//         }
//     });
// }

function successResponse(res) {
    // console.log('successRes')
    // console.log(res)
    let {
        cookieCheckStatus,
        requestStatus,
        rooms
    } = res;
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
        return {
            status: 0,
            rooms
        };
    }
}

function failResponse(err) {
    console.log('!!-fail Response:-!!')
    console.log(err);
    let {
        message,
        status
    } = err;
    chrome.browserAction.setIcon({
        path: 'fail.png'
    });

    chrome.runtime.sendMessage({
        action: 'popup-rooms-checked',
        status: status || 3,
        message: message || 'request failed!'
    });
    return {
        status,
        message
    };
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
            function (res) {
                return {
                    action: 'popup-cookies-checked',
                    status: 0
                };
            },
            function (res) {
                return {
                    action: 'popup-cookies-checked',
                    status: 1
                };
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
chrome.runtime.onMessage.addListener(function (request, sender) {
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
