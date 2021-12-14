// Function to retrieve form fields information
const getPageFormFieldsInformation = () => {
    let inputs = Array.from(document.querySelectorAll("input[type=text], input[type=email], input[type=password], input[type=number], input[type=tel]"));
    // Return without logging anything if no textfields found
    if (inputs.length === 0) return;
    let ids = [];
    inputs.map((input) => {
        ids.push(input.id);
    });
    console.log('The extension got Inputs: ', inputs);
    console.log('Ids: ' + ids);
    return [inputs, ids];
}

// Function to Get and Store Form Fields inside chrome local storage
const fetchFieldsHandler = () => {
    const [inputs, ids] = getPageFormFieldsInformation();
    chrome.storage.local.set({ "inputIds": ids }, () => {
        chrome.storage.local.get(['inputIds'], (data) => {
            console.log(data);
            console.log('Saved into local storage');
            chrome.runtime.sendMessage({ "action": "openOptionsPage" });
        })
    });
}

/* DEPRECATED LISTENERS */
// Message Listener for getFormFields
// chrome.runtime.onMessage.addListener(
//     function (request, sender, sendResponse) {
//         if (!request.getFormFields) return;
// console.log("received message from popup: " + request.getFormFields);
// fetchFieldsHandler();
//     });

// // Message Listener for fillFormFields
// chrome.runtime.onMessage.addListener(
//     function (request, sender, sendResponse) {
//         if (!request.fillFormFields) return;
// console.log("received message from popup: " + request.fillFormFields);
// fillFormFields();
//     });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message.action);
    switch (message.action) {
        case "fillFormFields":
            console.log('Got fillFormFields MSG');
            fillFormFields();
            break;
        case "getFormFields":
            console.log('Got getFormFields MSG');
            fetchFieldsHandler();
            break;
        default:
            console.log("Message not recognized");
            break;
    }
});

// Function to fill form input fields using stored data
const fillFormFields = () => {
    // Get the data from local storage
    chrome.storage.local.get(['excelData', 'inputIds', 'currentRow'], data => {
        const fields = data.inputIds;
        const excelData = data.excelData;
        let index = data.currentRow;

        console.log('Inputs: ');
        console.log(fields);
        console.log('Data: ');
        console.log(excelData);

        /*Goes through all the fields and then goes through all the key value pairs for data in each field. If a
        key matches to an ID of field, assigns its value to the field.
        */
        fields.map(field => {
            console.log(field);
            for (let [key, value] of Object.entries(excelData[index])) {
                console.log(key, value);
                if (key != field) continue;
                let input = document.getElementById(field);
                input.value = value;
            }
            console.log('--------------------------------');
        });
        if (data.currentRow === data.excelData.length - 1) return;
        index += 1;
        chrome.storage.local.set({ "currentRow": index });
    });
}