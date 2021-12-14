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
    let data = chrome.storage.local.get(['excelData', 'currentTab'], data => {
        jsonViewer.innerHTML = JSON.stringify(data.excelData);
        url.value = data.currentTab;
    });
}
