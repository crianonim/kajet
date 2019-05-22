window.addEventListener("load", init)
let chosen=null;
let mainElement=null;
function init() {
    console.log("KK")
    mainElement=document.getElementById('main')
    if (localStorage.data){
        data=JSON.parse(localStorage.data)
    }else {
        storeData();
    }
    redrawSide();
}
function createItemHtml(item) {
    return `
    <div class="item ${item.isDirectory ? 'dir-item' : 'file-item'}  ${item.collapsed?'collapsed':''}">
    <span class="name" onclick="choose(this)">${item.name}</span>
    ${item.isDirectory ? item.files.map(createItemHtml).join('\n') : ''}
    </div>
    `
}
function save(){
    if (chosen) {
        console.log(chosen.name)
        updateObj(chosen.name,mainElement.innerText);
    }
    storeData();
}
function choose(element) {
    let name = element.innerText;
    let item = findItemByName(name, data)
    if (!item.isDirectory) {
        save();
       mainElement.innerText = item.contents;
        chosen=item;
    } else {
        item.collapsed=!item.collapsed;
        console.log(item)
        element.parentElement.classList.toggle('collapsed')
    }
}
function redrawSide(){
    document.getElementById('side').innerHTML = data.map(createItemHtml).join('\n');
}
function input() {
    console.log(this)
}
function change(){
    console.log("change",this)
}
function updateObj(name,contents){
    let obj=findItemByName(name,data);
    console.log(contents)
    if (!obj.oldContents) {
        obj.oldContents=obj.contents;
    }
    if (contents!=obj.contents){
        console.log("Inne!");
        obj.contents=contents;
    }
}
function storeData(){
    localStorage.data=JSON.stringify(data);
}
function findItemByName(name, dir) {
    // console.log("Inside ",dir)
    let thisDir = dir.find(el => el.name == name);
    if (thisDir) return thisDir;
    let dirs = dir.filter(el => el.isDirectory);
    let found
    for (let i = 0; i < dirs.length; i++) {
        let check = findItemByName(name, dirs[i].files);
        if (check) {
            found = check;
            break;
        }
    }
    return found;
}