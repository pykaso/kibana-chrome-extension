// ** Kibana extension 
// ** Lukas Gergel
// **


function handleMutations(mutations) {
    mutations.forEach(mutation => {
        if (mutation.target.className != "euiDataGridRowCell__expandFlex") {
            return;
        }

        var values = mutation.target.getElementsByClassName("dscDiscoverGrid__cellValue");
        if (values.length > 0) {
            let type = mutation.target.parentElement.className.split("--")[1];
            let metadata = mutation.target.parentElement.dataset;
            metadata['type'] = type;
            var value = values[0].innerHTML;
            value = value
                .replace("<mark>", "")
                .replace("</mark>", "");

        
            if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].className == "euiDataGridRowCell__expandActions") {
                var container = mutation.addedNodes[0];

                if (container.getElementsByClassName("customFilterButton").length == 0) {
                    container.insertAdjacentHTML('afterbegin', '<button tabindex="-1" class="customFilterButton euiButtonIcon euiButtonIcon--xSmall euiDataGridRowCell__actionButtonIcon css-1q7ycil-euiButtonIcon-empty-primary-hoverStyles" type="button"><svg height="24px" width="24px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 47.94 47.94" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path style="fill:#ED8A19;" d="M26.285,2.486l5.407,10.956c0.376,0.762,1.103,1.29,1.944,1.412l12.091,1.757 c2.118,0.308,2.963,2.91,1.431,4.403l-8.749,8.528c-0.608,0.593-0.886,1.448-0.742,2.285l2.065,12.042 c0.362,2.109-1.852,3.717-3.746,2.722l-10.814-5.685c-0.752-0.395-1.651-0.395-2.403,0l-10.814,5.685 c-1.894,0.996-4.108-0.613-3.746-2.722l2.065-12.042c0.144-0.837-0.134-1.692-0.742-2.285l-8.749-8.528 c-1.532-1.494-0.687-4.096,1.431-4.403l12.091-1.757c0.841-0.122,1.568-0.65,1.944-1.412l5.407-10.956 C22.602,0.567,25.338,0.567,26.285,2.486z"></path> </g></svg></button>');
                }

                var newButton = container.getElementsByClassName("customFilterButton")[0];
                if (newButton) {
                    var callback = function(event) {
                        if (kontextoveMenu == null) {
                            var menu = createMenu(value, metadata);
                            document.body.appendChild(menu);
                            kontextoveMenu = menu;
                        }

                        kontextoveMenu.style.display = 'block';
                        kontextoveMenu.style.left = `${event.pageX}px`;
                        kontextoveMenu.style.top = `${event.pageY}px`;
                    };

                    newButton.addEventListener('click', callback);
                }
            }
        }
    });
}

document.addEventListener('click', function(event) {
    if (kontextoveMenu != null) {
        if (!kontextoveMenu.contains(event.target)) {
            removeMenu();
        }
    }
}, true);


function removeMenu() {
    kontextoveMenu.style.display = 'none';
    kontextoveMenu.parentElement.removeChild(kontextoveMenu);
    kontextoveMenu = null;
}

function createMenu(value, metadata) {
    const menu = document.createElement('div');
    menu.id = 'mojeKontextoveMenu';
    menu.style.display = 'none';
    menu.style.position = 'absolute';
    menu.style.background = 'white';
    //menu.style.border = '1px solid black';
    menu.style.borderRadius = '6px';
    menu.style.padding = '8px';
    menu.style.filter = 'drop-shadow(rgba(0, 0, 0, 0.2) 0px 5.7px 9px)';

    
    let searchInNewTab = createMenuItem("Search in new tab", icon_magnif, value, metadata, function(v,m) {
        return function() {
            let newHashPart = modifyUrlWithQuery(m.gridcellColumnId, value);
            var newURL = assembleURL(newHashPart);
            chrome.runtime.sendMessage({link: newURL});
            removeMenu();
        }
    });


    let filterInNewTab = createMenuItem("Filter in new tab", icon_funnel, value, metadata, function(v, m) {
        return function() {
            let newHashPart = modifyUrlWithFilter(m.gridcellColumnId, value, metadata.type);
            var newURL = assembleURL(newHashPart);
            chrome.runtime.sendMessage({link: newURL});
            removeMenu();
        }
    });

    menu.appendChild(searchInNewTab);
    menu.appendChild(filterInNewTab);

    menu.children[menu.children.length-1].style.borderBottom = '';
    return menu;
}



function modifyUrlWithQuery(key, value, type) {
    let _a = getRison_A();
    let _g = getRison_G();

    let newQuery =  key + ' : "' + value + '"';

    _a.query.query = newQuery
    return encodeHash(_a, _g);
}


function modifyUrlWithFilter(key, value, type) {
    let _a = getRison_A();
    let _g = getRison_G();
    
    var newFilter = null;
    if (type == 'datetime') {
        newFilter = createKibFilter_DateTime(key, value, false, _a)
    }
    else {
        newFilter = createKibFilter_Phrase(key, value, false, _a)
    }
    if (newFilter == null) { return; }
    _a.filters = [newFilter];
    _a.query.query = "";
    return encodeHash(_a, _g);
}




function encodeHash(_a, _g) {
    let newHash = "#/?_q" + rison.encode(_g) + "&_a=" + rison.encode(_a);
    console.log(newHash);
    return newHash;
}

function parseUrlAfterHash(url) {
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) {
        console.log('V URL nebyl nalezen žádný hash.');
        return {};
    }

    const queryString = url.substring(hashIndex + 1);
    const queryParams = new URLSearchParams(queryString);
    const params = {};

    // Procházení všech query parametrů a jejich přidání do objektu params
    queryParams.forEach((value, key) => {
        key =  key.replace(/\/\?/g, '')
        params[key] = value;
    });

    return params;
}


function getRison_A() {
    let queryParams = parseUrlAfterHash(window.location.href);
    let _a = rison.decode(queryParams['_a']);
    return _a;
}

function getRison_G() {
    let queryParams = parseUrlAfterHash(window.location.href);
    let _g = rison.decode(queryParams['_g']);
    return _g;
}


function createMenuItem(label, icon, value, metadata, createCallback) {
    const div = document.createElement('div');
    
    div.style.display = 'flex';
    div.style.alignItems = 'center'; // Zarovnání SVG a textu vertikálně
    div.style.padding = '8px';
    div.style.borderBottom = '1px solid #dfdfdf';

    // Vytvoření SVG elementu z řetězce
    var svgContainer = document.createElement('div');
    svgContainer.innerHTML = icon;

    // Vytvoření textového elementu
    var text = document.createElement('a');
    text.style.marginLeft = '10px'; // Mezera mezi ikonou a textem
    text.textContent = label;

    // Přidání SVG kontejneru a textu do DIV
    div.appendChild(svgContainer);
    div.appendChild(text);

    div.style.color = '#0061a6';
    div.addEventListener('click', createCallback(value, metadata));
    return div;
}


function createKibFilter_Phrase(field, value, negate, _a) {
    var filter = {
        "$state":{
            "store":"appState"
        },
        "meta":{
            "alias":null,
            "disabled":false,
            "field": field,
            "index": _a.index,
            "key": field,
            "negate": negate,
            "params":{
                "query": value
            },
            "type":"phrase"
        },
        "query": {
            "match_phrase": {}
        }
    };
    filter.query.match_phrase[field] = value;

    return filter;
}

function createKibFilter_DateTime(field, value, negate, _a) {
        var filter = {
        "$state":{
            "store":"appState"
        },
        "meta":{
            "alias":null,
            "disabled":false,
            "field": field,
            "index": _a.index,
            "key": field,
            "negate": negate,
            "params": {
                "format":"date_time",
                "gte": value,
                "lte": value
            },
            "type":"range",
            "value": {
                "format":"date_time",
                "gte": value,
                "lte": value
            },
        },
        "query": {
            "range": {}
        }
    };
    filter.query.range[field] = {
        "format":"date_time",
        "gte": value,
        "lte": value
    }

    return filter;
}


function assembleURL(newHashPart) {
    var loc = window.location;
    var newURL = loc.protocol + '//' + loc.host + loc.pathname + loc.search + newHashPart;
    return newURL;
}


var icon_funnel = '<svg fill="#0061a6" height="16px" width="16px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512.039 512.039" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M512.019,85.333c0-54.488-113.104-85.333-256-85.333s-256,30.845-256,85.333c0,12.847,6.294,24.379,17.777,34.503 l174.223,228.697v142.133c0,17.58,20.07,27.614,34.133,17.067l85.333-64c5.372-4.029,8.533-10.352,8.533-17.067v-78.133 l174.223-228.697C505.726,109.712,512.019,98.181,512.019,85.333z M256.019,42.667c116.314,0,213.333,26.459,213.333,42.667 c0,0.362-0.065,0.73-0.161,1.102c-1.531,0.739-3.048,1.687-4.528,2.871c-12.562,10.053-37.284,19.045-69.723,25.826 c-36.193,7.175-82.771,12.475-133.267,12.846c-0.109,0.001-0.218,0.002-0.328,0.003c-1.771,0.012-3.546,0.019-5.325,0.019 c-1.78,0-3.555-0.007-5.325-0.019c-0.109-0.001-0.218-0.002-0.328-0.003c-50.496-0.371-97.074-5.671-133.267-12.846 c-32.44-6.781-57.161-15.773-69.723-25.826c-1.481-1.185-2.997-2.133-4.528-2.871c-0.096-0.371-0.161-0.74-0.161-1.102 C42.686,69.125,139.706,42.667,256.019,42.667z M277.353,416l-42.667,32v-85.333h42.667V416z M288.119,320h-64.2L98.172,154.935 c41.876,9.971,94.385,15.369,151.984,15.712c1.95,0.013,3.904,0.02,5.863,0.02c1.959,0,3.913-0.007,5.863-0.02 c57.599-0.343,110.109-5.74,151.984-15.712L288.119,320z"></path> </g> </g> </g></svg>';
var icon_magnif = '<svg fill="#0061a6" height="16px" width="16px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512.006 512.006" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M491.952,398.615L365.696,274.413c11.888-24.973,18.549-52.914,18.549-82.413c0-106.033-85.967-192-192-192 s-192,85.967-192,192s85.967,192,192,192c29.237,0,56.942-6.547,81.746-18.238l124.404,126.439 c25.733,26.237,67.983,26.432,93.993,0.422C518.392,466.62,518.187,424.377,491.952,398.615z M42.912,192 c0-82.469,66.865-149.333,149.333-149.333S341.579,109.531,341.579,192c0,26.697-7.014,51.753-19.289,73.44 c-0.496,0.657-0.963,1.349-1.393,2.079c-13.039,22.13-31.524,40.553-53.655,53.455c-0.688,0.401-1.34,0.837-1.964,1.297 c-21.594,12.133-46.503,19.061-73.033,19.061C109.777,341.333,42.912,274.469,42.912,192z M462.219,462.453 c-9.237,9.237-24.246,9.167-33.386-0.152L311.181,342.725c11.613-9.176,22.135-19.668,31.353-31.247l119.51,117.567 C471.375,438.208,471.448,453.224,462.219,462.453z"></path> </g> </g> </g></svg>'
var kontextoveMenu;

// Vytvoření instance MutationObserver
const observer = new MutationObserver(handleMutations);

// Konfigurace observeru - co má sledovat
const config = {
    childList: true,   // sledovat přidané nebo odebrané potomky
    attributes: false,  // sledovat změny atributů
    subtree: true,     // sledovat všechny potomky cílového elementu
    characterData: false // sledovat změny datového obsahu
};

// Získání elementu, který chceme sledovat (v tomto případě celý dokument)
const targetNode = document.documentElement;

// Spuštění observeru
observer.observe(targetNode, config);

// Později, pokud chcete sledování zastavit:
// observer.disconnect();
