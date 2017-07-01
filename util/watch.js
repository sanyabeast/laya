var childProcess = require('child_process');
var chokidar = require("chokidar");
var colors = require("colors");
var changes = [];

var updateTrottling = 3000;
var updateTimeoutID;


var paths = [
  "res/layouts",
  "res/l18n",
  "res/skins"
];

for (var a = 0, watcher; a < paths.length; a++){
  watcher = chokidar.watch(paths[a]);
  watcher
      .on("change", onChange.bind(null, "change"))
      .on("unlink", onChange.bind(null, "unlink"));
}

function onChange(type, path, data){
  clearTimeout(updateTimeoutID);
  if (changes.indexOf(path) < 0) changes.push(path);
  updateTimeoutID = setTimeout(execute.bind(), updateTrottling);
}

function execute(){
  childProcess.exec("node util/res.js", function(error, stdout, stderr) {
    console.log("Watcher: resources update".green);
    logChanges();
    changes.length = 0;
  });
}

function logChanges(){
    for (var a = 0; a < changes.length; a++){
      console.log(changes[a].blue);
    }
}
