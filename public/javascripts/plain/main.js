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
        // alert(data)

    } else {
        data = await fetch('/json').then(res => res.json())
        sortData();
        // console.log(data)
        storeData();
    }
    redrawSide();
    autoSave();
    return
    navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => {
            console.log('Service worker registered.', reg);
        });
}

function createItemHtml(item) {
    if (!item.isDirectory) fileList.push(item.name);
    return `
    <div class="item ${item.isDirectory ? 'dir-item' : 'file-item'}  ${item.collapsed ? 'collapsed' : ''}">
    <span class="name" onclick="choose(this.innerText,this)">${item.name}</span>
    ${item.isDirectory ? getChildrenOfItem(item).map(createItemHtml).join('\n') : ''}
    </div>
    `
}

function clearStorage() {
    // alert(data);
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
        console.log("SAVING",chosen.name)
        updateObj(chosen.name, mainElement.innerText);
        storeItem(chosen);
    }
    // storeData();
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
    console.log("AutoSave");
    setTimeout(autoSave, AUTOSAVE_PERIOD);
    save();
}

function locallyChangedFiles() {
    return data.filter(el => el.oldContents);
}

function publish() {
    save();
    let toSave = data.filter(el => el.oldContents);
    // console.log(toSave);
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
        console.log("ALL done", res);
        fetch("/push").then((res) => {
            toSave.forEach(el => {
                console.log('CHAN', el)
                delete el.oldContents;
                storeData(el);
            })
        })
    }).catch(console.error);
}

function pull() {
    fetch('/pull').then((res) => res.json()).then((res) => {
        console.log(res);

        fetch('/json').then(res => res.json()).then(d => {
            data = d;
            storeData();
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
            choose(fileName)
        }

    }
}

function updateObj(name, contents) {
    let obj = findItemByName(name);

    if (contents != obj.contents) {
        console.log("Changed!", name);
        obj.oldContents = obj.contents;
        obj.contents = contents;
    }
    //  else {
    //     console.log("Back to old",name);
    //     delete obj.oldContents;
    // }
    storeItem(obj);
}

function storeData() {
    data.forEach(el => {
        storeItem(el);
    })
}

function storeItem(item) {
    console.log("Storing",item.name);
    localStorage.setItem(item.name, JSON.stringify(item))
}

function findItemByName(name) {
    return data.find(el => el.name == name)
}