import { getConnection, getUrlSearchParam, apiVersion } from '../lib/SFConnection.js';
let totalItems = 0;
let logList = [];
let logs = logList;
let windowWidth = window.innerWidth;

const overScan = 5;
const itemHeight = 25;
const windowHeight = getRemainingHeight();
const renderDiv = document.getElementById('renderDiv');
const totalHeightContainer = document.getElementById('totalHeightContainer');
const renderedHeightContainer = document.getElementById('renderedHeightContainer');

totalHeightContainer.addEventListener('scroll', render);
totalHeightContainer.style.height = `${windowHeight}px`;

window.addEventListener('resize', e => {
    windowWidth = e.target.innerWidth;
});

const activeFilters = new Set();

function setupLogFilter(elementId, className) {
    document.getElementById(elementId).addEventListener('change', e => {
        if (e.target.checked) {
            activeFilters.add(className);
        } else {
            activeFilters.delete(className);
        }
        applyFilters();
    });
}

function applyFilters() {
    if (activeFilters.size === 0) {
        logs = logList;
    } else {
        const filteredLogs = logList.filter(log => activeFilters.has(log.className));
        logs = filteredLogs;
    }
    render();
    totalHeightContainer.scroll(0, 0);
}

setupLogFilter('debug', 'line debug');
setupLogFilter('error', 'line error');
setupLogFilter('soql', 'line soql');

async function init() {
    const con = await getConnection();
    const logId = getUrlSearchParam('id');
    const log = await con.get(`/services/data/v${apiVersion}.0/tooling/sobjects/ApexLog/${logId}/Body`);
    logList = parseLog(log);
    logs = logList;
    totalItems = logList.length;
    renderedHeightContainer.style.height = `${totalItems * itemHeight}px`;
    render(null);
}
init();

function parseLog(rawLog) {
    const logList = rawLog.split('\n');
    const logListFormatted = [];
    logList.forEach(text => {
        const splittedText = splitStringByWindowWidth(text, windowWidth);
        const className = evalClassName(text);
        splittedText.forEach(t => {
            logListFormatted.push({
                text: t,
                className,
            });
        });
    });
    return logListFormatted;
}

function evalClassName(text) {
    return 'line ' + (text.includes('USER_DEBUG') ? 'debug' : (text.includes('FATAL_ERROR') || text.includes('EXCEPTION_THROWN')) ? 'error' : text.includes('SOQL_EXECUTE_BEGIN') ? 'soql' : '');
}

function splitStringByWindowWidth(input, windowWidth) {
    // Approximate width of a single character in pixels (12px font size, monospace average width)
    const charWidth = 8; // Average width for most fonts in pixels

    // Calculate the maximum number of characters that can fit in one line
    const maxCharsPerLine = Math.floor(windowWidth / charWidth);

    // Initialize result array and a buffer for the current line
    const result = [];
    let currentLine = "";

    // Split the input string by spaces and iterate through words
    const words = input.split(/(?<=\?)|(?<=&)|(?<=;)|(?<=,)| /);
    for (const word of words) {
        // Check if adding the word would exceed the max line length
        if ((currentLine.length + word.length + 1) <= maxCharsPerLine) {
            // Add word to the current line
            currentLine += (currentLine ? " " : "") + word;
        } else {
            // Push the current line to the result and start a new line
            if (currentLine) {
                result.push(currentLine);
            }
            currentLine = word;
        }
    }

    // Add the last line if it exists
    if (currentLine) {
        result.push(currentLine);
    }

    return result;
}

function render(e) {
    totalItems = logs.length;
    renderedHeightContainer.style.height = `${totalItems * itemHeight}px`;
    let scrollTop = e ? e.currentTarget.scrollTop : 0;
    let startIndex = Math.max(Math.min(Math.max(0, Math.floor(scrollTop / itemHeight) - overScan), totalItems - Math.floor(windowHeight / itemHeight) - 1), 0);
    let renderedItems = Math.floor(windowHeight / itemHeight) + 2 * overScan;
    renderedItems = Math.min(totalItems - startIndex, renderedItems);
    renderDiv.style.transform = `translateY(${startIndex * itemHeight}px)`;
    const list = logs.slice(startIndex, startIndex + renderedItems);
    point.attach('log', list);
}

function getRemainingHeight() {
    const topElements = document.querySelectorAll('.top-element');
    let totalTopHeight = 0;
    topElements.forEach(element => {
        totalTopHeight += element.offsetHeight;
    });
    const viewportHeight = window.innerHeight;
    const remainingHeight = viewportHeight - totalTopHeight;
    return remainingHeight;
}