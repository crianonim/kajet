var express = require('express');
var router = express.Router();
const path = require('path');
const lib = require('../lib');
router.get('/data', async (req, res) => {
  let data = await lib.readDir(path.join(__dirname, "..", "abulafa"));
  res.send(`let data=${JSON.stringify(data, null, 1)}`)
})
router.get('/json', async(req, res) => {
  let data = await lib.readDir(path.join(__dirname, "..", "abulafa"));
  res.json(data);
});
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
