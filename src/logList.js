/* global point */
import SFConnection from '../lib/SFConnection.js';

let con = null;
async function init() {
    con = await new SFConnection().init();
    const r = await con.getUserInfo();
    point.attach('userInfo', r);
}
init();