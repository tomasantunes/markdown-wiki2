var urlApi = "https://example.com";
var category_id = "";

chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        title: 'Save Selected Text to MarkdownWiki2',
        contexts: ["selection"],
        id: "saveTextContextAction"
    });

    chrome.contextMenus.create({
        title: "Save Image to MarkdownWiki2", 
        contexts: ["image", "link"], 
        id: "saveImageContextAction"
      });    
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
        if (request.category_id != "" && request.category_id != undefined) {
            sendResponse({status: "OK"})
        }
        sendResponse({status: "NOK"})
        console.log(request.category_id);
        category_id = request.category_id;
    }
  );

async function postData(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(data)
    });
    return response.json();
}
    
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId == "saveTextContextAction") {
        console.log(info.selectionText);
        postData(urlApi + "/api/files/insert", {
            title: "Note",
            content: info.selectionText,
            category: category_id,
            tags: "",
            extension: "txt"
        })
        .then((data) => {
            console.log(data); // JSON data parsed by `data.json()` call
        });
    }

    if (info.menuItemId == "saveImageContextAction") {
        console.log(info.srcUrl);

        postData(urlApi + "/api/upload-image-url", {
            imageUrl: info.srcUrl,
            category: category_id,
            tags: ""
        })
        .then((data) => {
            console.log(data); // JSON data parsed by `data.json()` call
        });
    }
});