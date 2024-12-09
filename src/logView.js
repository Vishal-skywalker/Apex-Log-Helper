import { getConnection, getUrlSearchParam } from '../lib/SFConnection.js';
let totalItems = 0;
let logList = [];

const overScan = 5;
const itemHeight = 25;
const windowHeight = getRemainingHeight();
const renderDiv = document.getElementById('renderDiv');
const totalHeightContainer = document.getElementById('totalHeightContainer');
const renderedHeightContainer = document.getElementById('renderedHeightContainer');

totalHeightContainer.addEventListener('scroll', render);
totalHeightContainer.style.height = `${windowHeight}px`;

async function init() {
    const con = await getConnection();
    const logId = getUrlSearchParam('id');
    const log = await con.get('/services/data/v35.0/tooling/sobjects/ApexLog/' + logId + '/Body');
    logList = parseLog(log);
    totalItems = logList.length;
    renderedHeightContainer.style.height = `${totalItems * itemHeight}px`;
    render(null);
}
init();

function parseLog(rawLog) {
    const logList = rawLog.split('\n');
    return logList.map(text => {
        return {
            text: text,
            className: evalClassName(text),
        }
    });
}

function evalClassName(text) {
    return 'line ' + (text.includes('USER_DEBUG') ? 'debug' : (text.includes('FATAL_ERROR') || text.includes('EXCEPTION_THROWN')) ? 'error' : '');
}

function render(e) {
    let scrollTop = e ? e.currentTarget.scrollTop : 0;
    let startIndex = Math.min(Math.max(0, Math.floor(scrollTop / itemHeight) - overScan), totalItems - Math.floor(windowHeight / itemHeight) - 1);
    let renderedItems = Math.floor(windowHeight / itemHeight) + 2 * overScan;
    renderedItems = Math.min(totalItems - startIndex, renderedItems);
    renderDiv.style.transform = `translateY(${startIndex * itemHeight}px)`;
    const list = logList.slice(startIndex, startIndex + renderedItems)
    point.attach('log', list);
}

function getRemainingHeight() {
    const topElements = document.querySelectorAll('.top-element');    
    let totalTopHeight = 0;
    topElements.forEach(element => {
        totalTopHeight += element.offsetHeight;
    });
    const viewportHeight = window.innerHeight;
    const remainingHeight = viewportHeight - totalTopHeight - 20;
    return remainingHeight;
}