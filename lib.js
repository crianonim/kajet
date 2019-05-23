const fs = require('fs').promises;
const fss= require('fs');
const promisify=require('util').promisify;
const readFile=promisify(fss.readFile);
const readdir=promisify(fss.readdir);
const stat=promisify(fss.stat);
const path = require('path');
let id=0;
function readDir(dir) {
    return new Promise((resolve, reject) => {
        let result = [];
        fs.readdir(dir).then((data) => {
            data = data.filter(name => !name.startsWith('.'))
            Promise.all(data.map(filename => {
                let currentPath = path.join(dir, filename);
                return fs.stat(currentPath).then((data) => {
                    let isDirectory = data.isDirectory();
                    let obj = { name: filename, isDirectory, path: currentPath }
                    result.push(obj);
                    if (isDirectory) {
                        return readDir(currentPath).then(
                            (dirData) => {
                                obj.files = dirData
                            })
                    } else {
                        return fs.readFile(currentPath, { encoding: 'utf8' }).then(
                            (contents) => {
                                obj.contents = contents;
                            }
                        )
                    }
                })
            })).then(() => {
                result.sort((a, b) => b.isDirectory - a.isDirectory)
                resolve(result)

            })
        })

    })
}
function readDirFlat(dir,current=[]) {
    return new Promise((resolve, reject) => {
       
        // fs.readdir(dir).then((data) => {
        readdir(dir).then((data) => {

            data = data.filter(name => !name.startsWith('.'))
            Promise.all(data.map(filename => {
                let currentPath = path.join(dir, filename);
                // return fs.stat(currentPath).then((data) => {
                return stat(currentPath).then((data) => {

                    let isDirectory = data.isDirectory();
                    let obj = { name: filename, isDirectory, path: currentPath, parent:dir }
                    current.push(obj);
                    if (isDirectory) {
                        return readDirFlat(currentPath,current)
                    } else {
                        // return fs.readFile(currentPath, { encoding: 'utf8' }).then(
                        return readFile(currentPath, { encoding: 'utf8' }).then(

                            (contents) => {
                                obj.contents = contents;
                            }
                        )
                    }
                })
            })).then(() => {
                current.sort((a, b) => b.isDirectory - a.isDirectory)
                resolve(current)

            })
        })

    })
}
module.exports = {
    readDir,
    readDirFlat
}
// readDir('abulafa').then(result=>console.log(JSON.stringify(result,null,2)))
//readDirFlat('abulafa',[]).then(result=>console.log(JSON.stringify(result,null,2)))