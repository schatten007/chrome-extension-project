// Context Menu Code Start

chrome.runtime.onInstalled.addListener(() => {
    // Creates the context menu
    chrome.contextMenus.create({
        "id": "mapperContextMenu",
        "title": "Excel Form Mapper",
        "contexts": ["all"]
    });
    //Adds a click listener to context menu
});

// Context Menu Code End

// Messages From Content Scripts

// Listener to open options page programatically form content scripts
chrome.runtime.onMessage.addListener((message) => {
    switch (message.action) {
        case "openOptionsPage":
            openOptionsPage();
            break;
        case "updateTab":
            console.log('Updating Tab');
            updateTab();
            break;
        case "backgroundAutoFill":
            console.log('Initiating Autofill');
            autoFormSubmission();
            break;
        default:
            break;
    }
});

const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
}

const updateTab = () => {
    chrome.storage.local.get(['currentTab'], (data) => {
        chrome.tabs.update({
            url: data.currentTab
        });
    });
}

/*
    Handling auto form submission, 3seconds cooldown to load the page. 
    Have to convert it so it checks if page has loaded in order to 
    continue submitting the data
*/
const autoFormSubmission = () => {
    chrome.storage.local.get(['excelData', 'currentRow'], (data) => {
        let total = data.excelData.length;
        let i = data.currentRow;
        updateTab();
        setInterval(() => {
            if (i >= total) return;
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                // Return if none open
                if (tabs.length == 0) return;
                //   Send message to content script to start autofill
                chrome.tabs.sendMessage(tabs[0].id, { "action": "autofillMessage" }, () => {
                    i++;
                    updateTab();
                });
            });
        }, 3000);
        chrome.storage.local.set({ "currentRow": i });
    });
}

/* Launch State Of Extension Variables */
chrome.storage.local.set({ "currentRow": 0, "mode": false, "idFound": false });
