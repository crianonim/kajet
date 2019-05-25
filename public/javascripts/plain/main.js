window.addEventListener("load", init)
let chosen = null;
let mainElement = null;
let data = [];
let fileList = [];
async function init() {
    mainElement = document.getElementById('main')
    if (localStorage.length) {
        Object.keys(localStorage).forEach(el => { data.push(JSON.parse(localStorage[el])) })
        data.sort((a, b) => a.name < b.name ? -1 : 1).sort((a, b) => b.isDirectory - a.isDirectory)
        // alert(data)

    } else {
        data = await fetch('/json').then(res => res.json())
        // console.log(data)
        storeData();
    }
    redrawSide();
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

function stepFile(step) {

    let index = step + (chosen ? fileList.indexOf(chosen.name) : -1);
    if (index < 0 || index >= fileList.length) return;
    choose(fileList[index])
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
function choose(name, element = null) {
    // let name = element.innerText;
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
        let { path, contents, parent } = file
        return fetch("/save", {
            method: "post",
            body: JSON.stringify({ path, contents, parent }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(res => res.json())
    })
    ).then((res) => {
        console.log("ALL done", res);
        fetch("/push").then((res) => {
            toSave.forEach(el => {
                console.log('CHAN', el)
                delete el.oldContents;
                storeData(el);
            })
        })
    }
    ).catch(console.error);
}
function pull() {
    fetch('/pull').then((res) => res.json()).then((res)=>{
        console.log(res);
       
        fetch('/json').then(res => res.json()).then (d=>{
            data=d;
            storeData();
            redrawSide();
            if (chosen && !chosen.isDirectory){
                chosen=findItemByName(chosen.name);
                mainElement.innerText = chosen.contents;
            }
        })
    })
}
function status() {
    fetch('/status').then((res) => res.json()).then((response)=>{
        console.log(response);
        let statusButton=document.getElementById("statusBtn");
        if (response.behind){
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
function addNewFile(){
    let fileName=document.querySelector("input[name='newFileName']").value;
    
    console.log(fileName);
    if (data.findIndex(el=>el.name==fileName)!=-1){
        console.log("This name is in use");
    } else {
        let correct=/^[.\p{L}\w-]+$/u.test(fileName)
        if (!correct){
            console.log("File is unique but not correct");
        } else {
            console.log("Fine,we can go ahead and create this one",fileName);
        }

    }
}

function updateObj(name, contents) {
    let obj = findItemByName(name);
    // console.log(contents)
    // if (!obj.oldContents) {
    //     obj.oldContents = obj.contents;
    // }
    if (contents != obj.contents) {
        console.log("Inne!");
        obj.oldContents=obj.contents;
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