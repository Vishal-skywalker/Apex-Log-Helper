(async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    console.log(tab.url);
    const myDomain = new URL(tab.url).hostname
        .replace(/\.lightning\.force\./, ".my.salesforce.")
        .replace(/\.mcas\.ms$/, "");
    if (myDomain.includes('.my.salesforce.')) {
        chrome.tabs.create({ url: "src/logList.html?host=" + myDomain });
    }
})();