var express = require('express');
var router = express.Router();
const path = require('path');
const lib = require('../lib');
const repo=path.join(__dirname, "..", "abulafa")
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
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Kajet' });
});
router.post('/save',(req,res)=>{
  console.log(req.body.data);
  res.json(req.body.data);
})

module.exports = router;
