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
        default:
            break;
    }
});

const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
}

/* Launch State Of Extension Variables */
chrome.storage.local.set({ "currentRow": 0 });
