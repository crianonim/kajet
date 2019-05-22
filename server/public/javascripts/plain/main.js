window.addEventListener("load", init)
function init() {
    console.log("KK")
    document.getElementById('side').innerHTML = data.map(createItemHtml).join('\n');
}
function createItemHtml(item) {
    return `
    <div class="item ${item.isDirectory ? 'dir-item' : 'file-item'}">
    <span class="name" onclick="choose(this)">${item.name}</span>
    ${item.isDirectory ? item.files.map(createItemHtml).join('\n') : ''}
    </div>
    `
}
function choose(element) {
    let name = element.textContent;
    let item = findItemByName(name, data)
    if (!item.isDirectory) {
        document.getElementById('main').textContent = item.contents;
    } else {
        element.parentElement.classList.toggle('collapsed')
    }
}
function input() {
    console.log(this)
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