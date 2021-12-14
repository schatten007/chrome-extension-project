// All the DOM Elements
// BUTTONS
const fetchFormFieldsButton = document.getElementById("fetchtags");
const fillFieldsButton = document.getElementById("fill-fields");
const nextRowButton = document.getElementById("next-row-button");
const prevRowButton = document.getElementById("prev-row-button");
const resetRowsButton = document.getElementById("reset-rows-button");
// SPAN
const currentRowSpan = document.getElementById("current-row");

const changeRow = (change) => {
    let msg = (change > 0) ? "Array index incremented" : "Array index decremented";
    console.log(msg);
    chrome.storage.local.get(['currentRow'], (data) => {
        console.log(data.currentRow);
        chrome.storage.local.set({ "currentRow": data.currentRow + change }, () => {
            console.log(`ArrayIndex indented, new value = ${data.currentRow}`);
            currentRowSpan.innerHTML = data.currentRow + change + 1;
        });
    });
};

const resetRows = () => {
    chrome.storage.local.set({ "currentRow": 0 }, () => {
        console.log('Rows Reset');
        currentRowSpan.innerHTML = 1;
    });
}

const saveActiveTab = () => {
    chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    }, function (tabs) {
        // and use that tab to fill in out title and url
        var tab = tabs[0];
        chrome.storage.local.set({ "currentTab": tab.url }, () => {
            chrome.storage.local.get(['currentTab'], data => console.log(data.currentTab));
        });
    });
}


// When the button is clicked, inject getPageFormFields into current page
fetchFormFieldsButton.addEventListener("click", async () => {
    // Get Current/Active Tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log('Fetch Fields Button Clicked');
        // Return if none open
        if (tabs.length == 0) return;
        //   Send message to content script to retrieve Form Fields
        chrome.tabs.sendMessage(tabs[0].id, { "action": "getFormFields" });
        //   Save the active tab into local.storage
        saveActiveTab();
    });
});

// Event Listener for insert Fill Form Fields button
fillFieldsButton.addEventListener("click", async () => {
    // Get Current/Active Tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log('Fill Fields Button Clicked');
        // Return if none open
        if (tabs.length == 0) return;
        //   Send message to content script to retrieve Form Fields
        chrome.tabs.sendMessage(tabs[0].id, { "action": "fillFormFields" });
    });
});

// Add code so rows dont extend the size of dataset or return if data Null
nextRowButton.addEventListener("click", () => {
    console.log('Next Row button Clicked');
    chrome.storage.local.get(['excelData', 'currentRow'], (data) => {
        if (data.excelData === "No Data Found") return;
        if (data.currentRow === data.excelData.length - 1) return;
        changeRow(1);
    });
});

// Add code so rows dont go below 0
prevRowButton.addEventListener("click", () => {
    console.log('Prev Row button Clicked');
    chrome.storage.local.get(['currentRow'], (data) => {
        if (data.currentRow <= 0) return;
        changeRow(-1);
    });
});

resetRowsButton.addEventListener("click", resetRows);

currentRowSpan.addEventListener("load", () => {
    console.log('Onload Ran');
    // Set value of row span on window load
    chrome.storage.local.get(['currentRow'], (data) => {
        currentRowSpan.innerHTML = data.currentRow;
    });
});