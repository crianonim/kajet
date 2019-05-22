const fs = require('fs').promises;
const path = require('path');

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
                resolve(result)

            })
        })

    })
}
module.exports = {
    readDir
}
// readDir('abulafa').then(result=>console.log(JSON.stringify(result,null,2)))
