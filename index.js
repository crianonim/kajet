const fs = require('fs').promises;


function readDir(dir) {
    return new Promise((resolve, reject) => {
        let result = [];
        fs.readdir(dir).then((data) => {
            data = data.filter(name => !name.startsWith('.'))
            Promise.all(data.map(filename => {
                return fs.stat(dir + '/' + filename).then((data) => {
                    let isDirectory = data.isDirectory();
                    let obj = { name: filename, isDirectory, path: dir + '/' + filename }
                    result.push(obj);
                    if (isDirectory) {
                        return readDir(dir + '/' + filename).then(
                            (dirData) => {
                                obj.files = dirData
                            })
                    } else {
                        return fs.readFile(dir+'/'+filename,{encoding:'utf8'}).then(
                            (contents)=>{
                                obj.contents=contents;
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

readDir('abulafa').then(result=>console.log(JSON.stringify(result,null,2)))
