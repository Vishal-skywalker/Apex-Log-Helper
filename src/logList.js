/* global point */
import SFConnection from '../lib/SFConnection.js';

const sfHost = getUrlSearchParam('host');
let con = null;
async function init() {
    let message = await new Promise(resolve =>
        chrome.runtime.sendMessage({ message: "getSession", sfHost }, resolve)
    );
    con = new SFConnection(message.hostName, message.key);
    const r = await con.getUserInfo();
    point.attach('userInfo', r);
}
init();

function getUrlSearchParam(name) {
    const search = new URLSearchParams(window.location.search);
    return search.get(name) ?? '';
}