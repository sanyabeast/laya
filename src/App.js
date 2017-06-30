"use strict";
define([
		"Laya/Laya",
		"base"
	], function(laya, base){

	var App = function(resData){
		this.load(resData);

	};

	App.prototype = {
		load : function(resData){
			for (var k in resData){
				for (var m in resData[k].content){
					base(m, resData[k].content[m]);
				}
			}
		}
	};

	return App;

});