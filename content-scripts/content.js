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

    /* Code to check if Form Inputs with Unique ID's Found */
    // let idsFound = false;
    // ids.forEach((id) => {
    //     if (id.length === 0) return;
    //     // idsFound = true;
    // });
    // chrome.storage.local.set({ "idFound": idsFound });
    // if (!idsFound) {
    //     console.log('No ID found');
    //     return;
    // }
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
    switch (message.action) {
        case "fillFormFields":
            console.log('Got fillFormFields MSG');
            fillFormFields();
            break;
        case "getFormFields":
            console.log('Got getFormFields MSG');
            fetchFieldsHandler();
            break;
        case "startAutofill":
            console.log('Got message to start autofill');
            autoFillForm();
            break;
        case "autofillMessage":
            console.log('Got autofill message from background script');
            autoSubmitHandler();
            break;
        default:
            console.log("Message not recognized");
            break;
    }
});

// Function to fill form input fields using stored data
const fillFormFields = () => {
    chrome.storage.local.get(['mode'], (data) => {
        (data.mode) ? manualFill() : autoFill();
    });
}

// Function to fill forms in AutoMap Mode
const autoFill = () => {
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
        console.log(`Current Row: ${index}`);
        chrome.storage.local.set({ "currentRow": index });
        chrome.runtime.sendMessage({ "action": "renderRows" });
    });
}

// Function to fill forms in ManualMap Mode
const manualFill = () => {
    chrome.storage.local.get(['excelData', 'currentRow', 'mappings'], (data) => {
        const excelData = data.excelData;
        const mappings = data.mappings;
        let index = data.currentRow;
        let rowFilled = false;

        mappings.forEach(mapping => {
            for (let [key, value] of Object.entries(excelData[index])) {
                if (key != mapping.column) continue;
                if (mapping.mappedTo === "None") continue;
                console.log(`${value} mapped to ${mapping.mappedTo}`);
                let input = document.getElementById(mapping.mappedTo);
                input.value = value;
            }
        });
        if (data.currentRow === data.excelData.length - 1) return;
        index += 1;
        chrome.storage.local.set({ "currentRow": index });
        chrome.runtime.sendMessage({ "action": "renderRows" });
        /* Failed Attempt */
        // fields.forEach( (field, i) => {
        //     mappings.forEach( (mapping, j) => {
        //         if(mapping.mappedTo != field) return;
        //         let input = document.getElementById(field);
        //         input.value = excelData
        //     });
        // });
    });
}

/* Function to handler auto filling and submitting all the data into form.
   Limited to the first form on page for now
   Logic:
   1: Go to target URL 
   2: Fetch current iteration from storage 
   3: Fetch total iteration from storage 
   4: Call fillFormFields 
   5: Submit Form
   6: Repeat until all fields exhausted
*/
const autoFillForm = () => {
    // Dont proceed if no form detected
    if (document.forms[0] === undefined) return;
    chrome.runtime.sendMessage({ "action": "backgroundAutoFill" });

    /* Deprecated Code */
    // chrome.storage.local.get(['excelData', 'currentRow'], (data) => {
    //     updateURL();
    //     let iterations = data.excelData.length;
    //     let i = data.currentRow;
    //     setInterval(() => {
    //         if (i >= iterations) return;
    //         alert(`test iteration ${i} of ${iterations}`);
    //         document.forms[0].submit();
    //         ++i;
    //         chrome.storage.local.set({ "currentRow": index });
    //     }, 2000);
    // });
}

const updateURL = () => {
    chrome.runtime.sendMessage({ "action": "updateTab" });
};

const autoSubmitHandler = () => {
    fillFormFields();
    document.forms[0].submit();
}