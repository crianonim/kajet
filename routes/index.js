var express = require('express');
var router = express.Router();
const path = require('path');
const lib = require('../lib');
const fs= require('fs');
const promisify=require('util').promisify;
const repo=path.join(__dirname, "..", "abulafa")
const git=require('simple-git/promise')(repo);
// router.get('/data', async (req, res) => {
//   let data = await lib.readDir(repo);
//   res.send(`let data=${JSON.stringify(data, null, 1)}`)
// })

router.get('/json', async(req, res) => {
  let data = await lib.readDirFlat(repo);
  data.forEach(el=>{
    el.path=path.relative(repo,el.path);
    el.parent=path.relative(repo,el.parent);
  })
  res.json(data);
});

router.post('/save',async (req,res)=>{
  console.log(req.body);
  let file=req.body;
  await promisify(fs.mkdir)(path.join(repo,file.parent),{recursive:true}).catch(console.error);
  await promisify(fs.writeFile)(path.join(repo,file.path),file.contents).catch(console.error)
  res.json(req.body);
})

router.get('/push', async function (req, res, next) {
  await git.add('.');
  await git.commit('Sync from app');
  await git.push();
console.log("PUSH")
res.send("OK")

});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Kajet' });
});
module.exports = router;
