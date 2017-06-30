var fs = require("fs");
var directory_tree = require("directory-tree");
var jsonfile = require("jsonfile");
var colors = require("colors");

make("res/layouts.json"	, "res/layouts"	, ["xml"], {
	readFile : true,
	extensionInName : false
});

make("res/skins.json"	, "res/skins"	, ["json"], {
	readFile : true,
	noName : true,
	extensionInName : false,
});

make("res/l18n.json"	, "res/l18n"	, ["json"], {
	readFile : true,
	noName : true,
	extensionInName : false,
});

/*---------------------------------------------------------------------------------*/
function writeJSON(path, data){
	jsonfile.writeFile(path, data, {spaces: 4}, function(err){
	  	console.log(path.red, "done".yellow, "[" + data.size.toString().green, "bytes".green + "]");
	});	

}

function make(/*str*/jsonPath, /*str*/path, /*arr*/exts, /*obj*/options){
	var tree = directory_tree(path);

	if (!tree){
		console.log("no such directory".red, path.yellow);
		return;
	}

	var result = {
		content  : {},
		size  : 0,
		count : 0,
		total : countFiles(tree, exts)
	};

	result = filterIteration(options, tree, exts, result, function(data){
		writeJSON(jsonPath, data);
	});

	//console.dir(tree);
}

function filterIteration(/*obj*/options, /*obj*/dir, /*arr*/exts, /*obj*/target, /*func*/onComplete){
	var item;

	for (var a = 0, l = dir.children.length; a < l; a++){
		item = dir.children[a];

		if (item.extension && fileMatches(item, exts)){		

			if (options.readFile){
				fs.readFile(item.path, "utf8", function(err, data) {
					var name = options.extensionInName ? this.name : removeExtension(this);
					var path = cvrtPath(this);

					target.count++;
					target.size += item.size;

					if (options.noName == true){
						target.content[path + "." + name] = data;						
					} else {
						target.content[path + "::" + name] = data;						
					}


					if (target.total == target.count){
						delete target.count;
						onComplete(target);
					}

				}.bind(item));

			} else {
				var name = options.extensionInName ? item.name : removeExtension(item);
				var path = cvrtPath(item);

				target.count++;
				target.size += item.size;

				if (options.noName == true){
					target.content[path + "." + name] = formatPath(item, options.extensionInPath);					
				} else {
					target.content[path + "::" + name] = formatPath(item, options.extensionInPath);					
				}


				if (target.total == target.count){
					delete target.count;
					onComplete(target);
				}
			}

		} else if (item.children){
			target = filterIteration(options, item, exts, target, onComplete);
		}
	}

	return target;
}

function fileMatches(file, exts){
	var ext = file.extension.split(".")[1];
	return exts.indexOf(ext) > -1;
}

function removeExtension(file){
	return file.name.replace(file.extension, "");
}

function cvrtPath(file){
	var path = file.path;
	path = path.replace(file.name, "");
	path = path.replace("assets\\", "");
	path = path.replace(/\\/g, ".");
	path = path.substring(0, path.length - 1);
	return path;
}

function formatPath(file, includeExt){
	var path = file.path;
	if (includeExt === false){
		path = path.replace(file.extension, "");
	}

	return path.replace(/\\/g, "/");
}

function countFiles(dir, exts){
	var result = 0, item;

	for (var a = 0, l = dir.children.length; a < l; a++){
		item = dir.children[a];

		if (item.extension && fileMatches(item, exts)){
			result++;
		} else if (item.children){
			result += countFiles(item, exts);
		}

	}

	return result;
}
/*---------------------------------------------------------------------------------*/
