window.addEventListener("load", init)
let chosen = null;
let mainElement = null;
let data = [];
async function init() {
    mainElement = document.getElementById('main')
    if (localStorage.length) {
        Object.keys(localStorage).forEach(el => { data.push(JSON.parse(localStorage[el])) })
        data.sort((a, b) => a.name < b.name ? -1 : 1).sort((a, b) => b.isDirectory - a.isDirectory)

    } else {
        data = await fetch('/json').then(res => res.json())
        // console.log(data)
        storeData();
    }
    redrawSide();
}
function createItemHtml(item) {
    return `
    <div class="item ${item.isDirectory ? 'dir-item' : 'file-item'}  ${item.collapsed ? 'collapsed' : ''}">
    <span class="name" onclick="choose(this)">${item.name}</span>
    ${item.isDirectory ? getChildrenOfItem(item).map(createItemHtml).join('\n') : ''}
    </div>
    `
}
function save() {
    if (chosen) {
        // console.log(chosen.name)
        updateObj(chosen.name, mainElement.innerText);
    }
    storeData();
}
function getChildrenOfItem(item) {
    return data.filter(el => el.parent == item.path)
}
function choose(element) {
    let name = element.innerText;
    let item = findItemByName(name)
    // console.log(item.contents)

    if (!item.isDirectory) {
        if (chosen) {
            if (!chosen.isDirectory) {
                updateObj(chosen.name, mainElement.innerText);
                storeItem(chosen)
            }
        }
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
function input() {
    // console.log(this)
}
function publish() {
    save();
    let toSave = data.filter(el => el.oldContents);
    // console.log(toSave);
    Promise.all(toSave.map(file => {
        let { path, contents,parent } = file
        return fetch("/save", {
            method: "post",
            body: JSON.stringify({ path, contents,parent }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(res=>res.json())
    })
    ).then((res) => {
        console.log("ALL done",res);
        fetch("/push").then( (res)=>{
            toSave.forEach(el=>{
                console.log('CHAN',el)
                delete el.oldContents;
                storeData(el);
            })
        })
    }
    ).catch(console.error);
}

function toggleSide(){
    
    let side=document.getElementById('side')
    console.log("SIDE",side)
    side.classList.toggle('hidden');
}

function updateObj(name, contents) {
    let obj = findItemByName(name);
    // console.log(contents)
    if (!obj.oldContents) {
        obj.oldContents = obj.contents;
    }
    if (contents != obj.contents) {
        console.log("Inne!");
        obj.contents = contents;
    }
}
function storeData() {
    data.forEach(el => {
        storeItem(el);
    })
}
function storeItem(item) {
    localStorage.setItem(item.name, JSON.stringify(item))
}
function findItemByName(name) {
    return data.find(el => el.name == name)
}