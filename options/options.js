// Logic For Parsing XLSX|XLS into JSON
var selectedFile;

// Function to change the selected file
document.getElementById("fileUpload").addEventListener("change", (event) => {
    selectedFile = event.target.files[0];
});

// Parse and Save Excel Data into chrome sync storage
document.getElementById("uploadExcel").addEventListener("click", () => parseExcelData());

// Discarding Excel Data from chrome local storage
document.getElementById("discardButton").addEventListener("click", () => {
    chrome.storage.local.set({ "excelData": "No Data Found" }, () => {
        chrome.storage.local.get(['excelData'], data => console.log(data));
    });
    document.getElementById("jsonData").innerHTML = `"No Data Found"`;
});



// Save Excel data into Sync Storage 
const saveExcelData = (data) => {
    console.log(data);
    chrome.storage.local.set({ "excelData": data }, () => {
        chrome.storage.local.get(['excelData'], data => console.log(data));
    });
}

// Reads the file as a binary string, and parses into json object. Saves the object into chrome local storage
const parseExcelData = () => {
    if (!selectedFile) return;

    var fileReader = new FileReader();
    fileReader.onload = event => {
        var data = event.target.result;

        var workbook = XLSX.read(data, {
            type: "binary"
        });

        workbook.SheetNames.forEach(sheet => {
            let rowObject = XLSX.utils.sheet_to_row_object_array(
                workbook.Sheets[sheet]
            );
            let jsonObject = JSON.stringify(rowObject);
            document.getElementById("jsonData").innerHTML = jsonObject;
            saveExcelData(rowObject);
        });
    };

    fileReader.readAsBinaryString(selectedFile);
}

// Preload Data into JSON Viewer from chrome.storage API
window.onload = () => {
    const jsonViewer = document.getElementById("jsonData");

    const url = document.getElementById("current-url");

    const modeSwitch = document.getElementById("mode-switch");


    chrome.storage.local.get(['excelData', 'currentTab', 'inputIds', 'mode'], data => {
        jsonViewer.innerHTML = JSON.stringify(data.excelData);
        url.value = data.currentTab;
        modeSwitch.checked = data.mode;
        let labelText = (data.mode) ? "Manual Mapping Mode" : "Automatic Mapping Mode";
        document.getElementById("mode-switch-label").innerText = labelText;
        generateTable();
    });
}


const generateTable = () => {
    chrome.storage.local.get(['excelData', 'inputIds'], (data) => {
        const excelData = data.excelData;
        const inputIds = data.inputIds;
        const keys = Object.keys(excelData[0]);
        const mappedData = keyMapper(inputIds, keys);
        console.log('This thing: ');
        console.log(mappedData);

        console.log('ExcelData Columns');
        console.log(Object.keys(excelData[0]));
        console.log('Form Input Ids');
        console.log(inputIds);

        /*
            Header Code
         */
        let headers = ['#', 'Excel Column', 'Mapped To (ID)'];
        let table = document.createElement('table');
        table.id = 'map-table';
        table.classList.add('table');
        let headerRow = document.createElement('tr');
        headerRow.classList.add('table-secondary');

        headers.forEach(headerText => {
            let header = document.createElement('th');
            let textNode = document.createTextNode(headerText);
            header.appendChild(textNode);
            headerRow.appendChild(header);
        });
        table.appendChild(headerRow);

        generateRows(mappedData, inputIds, table);



        document.getElementById("data-table").appendChild(table);
    });
};

const generateRows = (mappedData, inputIds, table) => {
    /*
           Row Code
        */
    mappedData.forEach((dataItem, i = 1) => {
        let row = document.createElement('tr');
        row.classList.add('table-secondary');

        let num = document.createElement('td');
        num.appendChild(document.createTextNode(i));
        row.appendChild(num);

        let colName = document.createElement('td');
        colName.appendChild(document.createTextNode(dataItem.colName));
        row.appendChild(colName);

        let inputIdCol = document.createElement('td');
        let select = document.createElement('Select');

        inputIds.forEach((option, i) => {
            if (i === 0) {
                select.options.add(
                    new Option("None", null, false)
                )
            }
            (option === dataItem.colName) ?
                select.options.add(
                    new Option(option, option, true)
                ) : select.options.add(
                    new Option(option, option, false)
                );
        });

        inputIdCol.appendChild(select);
        row.appendChild(inputIdCol);



        /*
            MapButton Code 
        */
        // let mapButtonCol = document.createElement('td');
        // let btn = document.createElement('button');
        // btn.innerText = 'Map';
        // btn.id = `map-${dataItem.colName}`;
        // btn.classList.add('btn-primary');
        // btn.onclick = mapButtonHandler;
        // row.appendChild(mapButtonCol.appendChild(btn));


        // Object.values(dataItem).forEach(item => {
        //     let cell = document.createElement('td');
        //     let textNode = document.createTextNode(item);
        //     cell.appendChild(textNode);
        //     row.appendChild(cell);
        // });

        table.appendChild(row);
        i++;
    });
}

/* To Pre-Select Inputs which match with Col Names for Rendering  */
const keyMapper = (inputs, cols) => {
    const mappedData = [];
    const unMappedData = [];

    cols.forEach(col => {
        inputs.forEach(input => {
            if (col === input) mappedData.push({ colName: col, inputId: input });
        });
    });
    console.log('Matching Fields');
    console.log(mappedData);
    if (mappedData.length != 0) return mappedData;
    cols.forEach((col, i) => {
        unMappedData.push({ colName: col, inputId: inputs[i] })
    });
    return unMappedData;
};

const mapButtonHandler = () => {
    console.log('-'.repeat(50));
    let table = document.getElementById("map-table");
    let formIds = getSelectedIds(table);
    let mappedData = [];
    console.log(formIds);
    chrome.storage.local.get(['excelData'], (data) => {
        let columnNames = Object.keys(data.excelData[0]);
        console.log(columnNames);
        console.log(data.excelData);
        columnNames.forEach((column, i) => {
            mappedData.push({
                "column": column,
                "mappedTo": formIds[i]
            });
        });
        console.log(mappedData);
        chrome.storage.local.set({ "mappings": mappedData });

        /* Deprecated Code */
        // data.excelData.forEach((row, i) => {
        //     let mappedObj = {};
        //     console.log(`row ${i}`);
        //     Object.values(row).forEach((value) => {
        //         let key = formIds[i];
        //         mappedObj = {
        //             ...mappedObj,
        //             [key]: value
        //         }
        //         console.log(mappedObj);
        //     });
        //     mappedData.push(mappedObj);
        // });
        // console.log(('+').repeat(50));
        // console.log(mappedData);
    });
}

// MapButton Listener
document.getElementById("map-button").addEventListener("click", mapButtonHandler);

const getSelectedIds = (table) => {
    let rows = table.childNodes;
    let selects = [];
    rows.forEach((row, i) => {
        if (i === 0) return;
        selects.push(row.childNodes[2].childNodes[0]);
    });
    let selectedIds = [];
    selects.forEach(element => {
        selectedIds.push(element.options[element.selectedIndex].text);
    });
    return selectedIds;
}

document.getElementById("mode-switch").addEventListener("click", (e) => {
    chrome.storage.local.get(['mode'], (data) => {
        let newMode = !data.mode;
        chrome.storage.local.set({ "mode": newMode }, () => {
            console.log(`mode = ${newMode}`);
            let labelText = (newMode) ? "Manual Mapping Mode" : "Automatic Mapping Mode";
            document.getElementById("mode-switch-label").innerText = labelText;
        });
    });
});