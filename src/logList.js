/* global point */
import { getConnection, getUrlSearchParam } from '../lib/SFConnection.js';

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
}

let con = null;
async function init() {
    setPointModifiers();
    con = await getConnection();
    const r = await con.getUserInfo();
    point.attach('userInfo', r);
    getLogs(con);
}
init();

async function getLogs(con) {
    const logs = await con.get('/services/data/v62.0/query/?q=' + encodeURI('SELECT Id, LogUser.Name, LogLength, Operation, Status, DurationMilliseconds, StartTime FROM ApexLog ORDER BY LastModifiedDate DESC'));
    point.attach('apexLogs', logs.records);
}