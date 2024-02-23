chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if(message.link) {
        chrome.tabs.create({url: message.link, active: false});
    }
});