import { getConnection, getUrlSearchParam, apiVersion } from '../lib/SFConnection.js';
let totalItems = 0;
let logList = [];
let logs = logList;
let _logs;
let windowWidth = window.innerWidth;

const overScan = 5;
const itemHeight = 25;
const windowHeight = getRemainingHeight();
const renderDiv = document.getElementById('renderDiv');
const totalHeightContainer = document.getElementById('totalHeightContainer');
const renderedHeightContainer = document.getElementById('renderedHeightContainer');

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        document.getElementById('search').focus();
    }
});

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
        logs = JSON.parse(JSON.stringify(logList));
    } else {
        const filteredLogs = logList.filter(log => activeFilters.has(log.className));
        logs = JSON.parse(JSON.stringify(filteredLogs));
    }
    _logs = JSON.parse(JSON.stringify(logs));
    render();
    totalHeightContainer.scroll(0, 0);
}

setupLogFilter('debug', 'line debug');
setupLogFilter('error', 'line error');
setupLogFilter('soql', 'line soql');

async function init() {
    const con = await getConnection();
    const logId = getUrlSearchParam('id');
    const logIdKey = `log_${logId}`;
    let log = sessionStorage.getItem(logIdKey);
    if (!log) {
        log = await con.get(`/services/data/v${apiVersion}.0/tooling/sobjects/ApexLog/${logId}/Body`);
        sessionStorage.setItem(logIdKey, log);
    }
    logList = parseLog(log);
    logs = JSON.parse(JSON.stringify(logList));
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
    const remainingHeight = viewportHeight - totalTopHeight - 20;
    return remainingHeight;
}

const searchInfo = { at: 0, total: 0 };
function attachSearchInfo(info = { at: searchInfo.at, total: searchInfo.total }) {
    searchInfo.at = info.at;
    searchInfo.total = info.total;
    point.attach('searchInfo', info);
}
attachSearchInfo();

document.getElementById('up').addEventListener('click', () => navigateSearchResults(-1));
document.getElementById('down').addEventListener('click', () => navigateSearchResults(1));

function navigateSearchResults(direction) {
    const highlights = [];
    logs.forEach((log, index) => {
        // Remove 'active' class from all highlights
        log.text = log.text.replace(/<span class="highlight active">(.*?)<\/span>/g, '<span class="highlight">$1</span>');

        if (log.text.includes('<span class="highlight"')) {
            const regex = /<span class="highlight">(.*?)<\/span>/g;
            let match;
            let matchIndex = 0;
            while ((match = regex.exec(log.text)) !== null) {
                highlights.push({
                    element: log,
                    offsetTop: index * itemHeight,
                    text: match[1],
                    index,
                    matchIndex
                });
                matchIndex++;
            }
        }
    });

    if (highlights.length === 0) return;

    searchInfo.at = (searchInfo.at + direction + highlights.length) % highlights.length;
    const targetHighlight = highlights[searchInfo.at];

    // Add 'active' class to the target highlight
    const regex = new RegExp(`<span class="highlight">${targetHighlight.text}</span>`, 'g');
    let matchCount = -1;
    logs[targetHighlight.index].text = logs[targetHighlight.index].text.replace(regex, (match) => {
        matchCount++;
        if (matchCount === targetHighlight.matchIndex) {
            return `<span class="highlight active">${targetHighlight.text}</span>`;
        }
        return match;
    });

    const scrollPosition = targetHighlight.offsetTop - totalHeightContainer.offsetTop;
    totalHeightContainer.scrollTo(0, scrollPosition);

    attachSearchInfo({ at: searchInfo.at, total: searchInfo.total });
}

function search(e) {
    if (!_logs) {
        _logs = JSON.parse(JSON.stringify(logs));
    }
    const s = e.target.value;
    let count = 0;
    let gToIndex = 0;
    if (s) {
        logs = _logs.map((log, index) => {
            if (log.text.toLowerCase().includes(s.toLowerCase())) {
                const regex = new RegExp(e.target.value, 'ig');
                let matchCount = 0;
                const highlightedText = log.text.replace(regex, match => {
                    matchCount++;
                    return `<span class="highlight">${match}</span>`;
                });
                if (count === 0) {
                    gToIndex = index;
                }
                count += matchCount;
                return {
                    text: highlightedText,
                    className: log.className,
                };
            } else {
                return {
                    className: log.className,
                    text: log.text.replace(/<span class="highlight">(.*?)<\/span>/ig, '$1'),
                };
            }
        });
    } else {
        logs = _logs;
    }
    attachSearchInfo({ at: count ? 1 : 0, total: count });
    if (gToIndex > 0) {
        totalHeightContainer.scrollTo(0, gToIndex * itemHeight);
    } else {
        totalHeightContainer.scrollTo(0, 0);
        render();
    }
}

document.getElementById('search').addEventListener('input', search);
document.getElementById('search').addEventListener('keydown', e => {
    if (e.shiftKey && e.key === 'Enter') {
        navigateSearchResults(-1);
    } else if (e.key === 'Enter') {
        navigateSearchResults(1);
    }
});