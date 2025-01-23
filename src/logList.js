/* global point */
import { getConnection, getUrlSearchParam, apiVersion } from '../lib/SFConnection.js';

function setPointModifiers() {
    const pageUrl = chrome.runtime.getURL('src/logView.html');
    const host = getUrlSearchParam('host');
    point.modifier('formatted_date', (val) => {
        if (typeof val === 'string') {
            return new Date(val).toLocaleString();
        }
        return val;
    });
    point.modifier('log_view_url', (val) => {
        return `${pageUrl}?id=${val}&host=${host}`;
    });
    point.modifier('user_detail_url', (val) => {
        return `https://${host}/${val}?noredirect=1&isUserEntityOverride=1`;
    });
}

let con = null;
async function init() {
    setPointModifiers();
    con = await getConnection();
    processUserInfo(con);
    getLogs(con);
}
init();

async function processUserInfo(con) {
    const r = await con.getUserInfo();
    point.attach('userInfo', r);
}

async function getLogs(con) {
    const logs = await con.get(`/services/data/v${apiVersion}.0/query/?q=${encodeURI('SELECT Id, LogUser.Name, LogUserId, LogLength, Operation, Status, DurationMilliseconds, StartTime FROM ApexLog ORDER BY LastModifiedDate DESC LIMIT 50')}`);
    point.attach('apexLogs', logs.records);
}