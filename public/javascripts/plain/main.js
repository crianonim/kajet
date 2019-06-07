const AUTOSAVE_PERIOD = 5000;
window.addEventListener("load", init)
let chosen = null;
let mainElement = null;
let data = [];
let fileList = [];
async function init() {
    mainElement = document.getElementById('main')
    if (localStorage.length) {
        Object.keys(localStorage).forEach(el => {
            data.push(JSON.parse(localStorage[el]))
        })
        sortData();

    } else {
        await loadDataFromServer();
    }
    redrawSide();
    autoSave();
    return
    navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => {
            console.log('Service worker registered.', reg);
        });
}
async function loadDataFromServer() {
    data = await fetch('/json').then(res => res.json())
    sortData();
    storeAllData();
}
function createItemHtml(item) {
    if (!item.isDirectory) fileList.push(item.name);
    return `
    <div class="item ${item.isDirectory ? 'dir-item' : 'file-item'}  ${item.collapsed ? 'collapsed' : ''}">
    <span class="name ${item.modified ? "modified" : ""}" onclick="choose(this.innerText,this)">${item.name}</span>
    ${item.isDirectory ? getChildrenOfItem(item).map(createItemHtml).join('\n') : ''}
    </div>
    `
}

function clearStorage() {
    localStorage.clear();
}

function sortData() {
    data.sort((a, b) => a.name < b.name ? -1 : 1).sort((a, b) => b.isDirectory - a.isDirectory)
}
// move to next (or +step, -step) file
function stepFile(step = 1) {
    let index = step + (chosen ? fileList.indexOf(chosen.name) : -1);
    if (index < 0 || index >= fileList.length) return;
    choose(fileList[index])
}

function save() {
    if (chosen && !chosen.isDirectory) {
        // console.log("SAVING", chosen.name)
        updateObj(chosen.name, mainElement.innerText);
    }
}

function getChildrenOfItem(item) {
    return data.filter(el => el.parent == item.path)
}

function choose(name, element = null) {
    // let name = element.innerText;
    let item = findItemByName(name)
    // console.log(item.contents)

    if (!item.isDirectory) {
        save();
        mainElement.innerText = item.contents;
    } else {
        item.collapsed = !item.collapsed;
        console.log(item)
        element.parentElement.classList.toggle('collapsed')
    }
    chosen = item;
    document.getElementById("chosen").innerText = chosen.name
}

function redrawSide() {
    document.getElementById('side').innerHTML = data.filter(el => el.parent == "").map(createItemHtml).join('\n');
}

//whenever key is pressed
function input() {

}

function autoSave() {
    // console.log("AutoSave");
    setTimeout(autoSave, AUTOSAVE_PERIOD);
    save();
}

function locallyChangedFiles() {
    return data.filter(el => el.oldContents);
}

async function publish() {
    save();
    let toSave = locallyChangedFiles()
    Promise.all(toSave.map(file => {
        let {
            path,
            contents,
            parent
        } = file
        return fetch("/save", {
            method: "post",
            body: JSON.stringify({
                path,
                contents,
                parent
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(res => res.json())
    })).then((res) => {
        console.log("ALL saved", res);
        fetch("/push").then(async () => {
            await loadDataFromServer();
            redrawSide();
            if (chosen && !chosen.isDirectory) {
                chosen = findItemByName(chosen.name);
                mainElement.innerText = chosen.contents;
            }
        })
    }).catch(console.error);
}

function pull() {
    fetch('/pull').then((res) => res.json()).then((res) => {
        console.log(res);

        fetch('/json').then(res => res.json()).then(d => {
            data = d;
            storeAllData();
            sortData();
            redrawSide();
            if (chosen && !chosen.isDirectory) {
                chosen = findItemByName(chosen.name);
                mainElement.innerText = chosen.contents;
            }
        })
    })
}

function status() {
    fetch('/status').then((res) => res.json()).then((response) => {
        console.log(response);
        let statusButton = document.getElementById("statusBtn");
        if (response.behind) {
            console.log("we are behind");
            statusButton.classList.add("red");
        } else {
            statusButton.classList.remove('red');
        }

    })
}

function toggleSide() {
    let options = document.getElementById('options');
    let side = document.getElementById('side')
    console.log("SIDE", side)
    side.classList.toggle('hidden');
    options.classList.toggle('hidden');

}

function addNewFile() {
    let fileName = document.querySelector("input[name='newFileName']").value;

    console.log(fileName);
    if (data.findIndex(el => el.name == fileName) != -1) {
        console.log("This name is in use");
    } else {
        let correct = /^[.\p{L}\w-]+$/u.test(fileName)
        if (!correct) {
            console.log("File is unique but not correct");
        } else {
            console.log("Fine,we can go ahead and create this one", fileName);
            let obj = {
                contents: "new",
                oldContents: "<<NEW_FILE>>",
                name: fileName,
                isDirectory: false
            }
            if (chosen && chosen.isDirectory) {
                console.log("Will create a file under", chosen.path);
                obj.parent = chosen.path;
            } else {
                console.log("Will create in main dir");
                obj.parent = "";
            }
            obj.path = obj.parent + '/' + fileName;
            data.push(obj);
            sortData();
            redrawSide();
            console.log("OBJ", obj)
            storeItem(obj);
            choose(fileName)
        }

    }
}

function updateObj(name, contents) {
    let obj = findItemByName(name);
    let changed = false;
    if (contents == obj.oldContents && obj.modified) {
        obj.modified = false;
        obj.contents = contents;
        changed = true;
        console.log("Back to old", name);
        delete obj.oldContents;
    } else if (contents != obj.contents) {
        console.log("Changed!", name);
        changed = true;
        if (!obj.oldContents) {
            obj.oldContents = obj.contents;
        }
        obj.contents = contents;
        obj.modified = true;
    }

    if (changed) {
        redrawSide();
        storeItem(obj);
    }
}

function storeAllData() {
    data.forEach(el => {
        storeItem(el);
    })
}

function storeItem(item) {
    console.log("Storing", item.name);
    localStorage.setItem(item.name, JSON.stringify(item))
}

function findItemByName(name) {
    return data.find(el => el.name == name)
}