"use strict";
define(["laya/modules/Util"], function(Util){

	var util = new Util();

	var Template = function(tplString){
		tplString = tplString || "";
		this.string = util.superTrim(tplString);	
	};

	Template.fast = function(string, settings, getter){
		var t = new Template(string);
		return t.make(settings, getter);
	};

	Template.prototype = {
		fast : Template.fast,
		get string(){
			return this._string;
		},
		set string(value){
			this._string = value;
			this.update();
		},
		update : function(){
			var matches = this._string.match(/\{{[^${]*}}/g) || [];
			var vars = [];

			for (var a = 0, l = matches.length, name; a < l; a++){
				name = matches[a].substring(2, matches[a].length - 2);
				if (vars.indexOf(name) < 0) vars.push(name);
			}

			this._vars = vars;
		},
		make : function(settings, /*func*/getter){
			settings = settings || {};

			var string = this._string;
			var vars = this._vars;

			if (getter){
				for (var a = 0, l = vars.length; a < l; a++){
					string = string.replace(new RegExp("\\{{" + vars[a] + "}}", "g"), (getter(vars[a], settings)));
				}

			} else {
				for (var a = 0, l = vars.length; a < l; a++){
					string = string.replace(new RegExp("\\{{" + vars[a] + "}}", "g"), (typeof settings[vars[a]] == "undefined" ? "" : settings[vars[a]]));
				}

			}

			
			return string;
		}
	};

	return Template;

});