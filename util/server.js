var childProcess = require('child_process');

childProcess.exec("ipconfig", function(error, stdout, stderr) {
  console.log(error, stdout, stderr);
});
