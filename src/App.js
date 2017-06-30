"use strict";
define([
		"Laya/laya",
		"base",
		"file!../res/layouts.css"
	], function(laya, base, layoutsCSS){

	var App = function(resData){
		laya.setBase(base);
		this.loader.load(resData);
		laya.css.setup(layoutsCSS);
		this.dom = laya.make("~res.layouts::app", {

		});

		document.body.addChild(this.dom);

	};

	App.prototype = {
		loader : {
			load : function(resData){
				for (var k in resData){
					this[k](resData[k].content);
				}
			},
			layouts : function(data){
				for (var k in data){
					base(k, data[k]);
				}
			},
			skins : function(data){
				var keys;
				for (var k in data){
					keys = JSON.parse(data[k]);
					for (var m in keys){
						base(k + "::" + m, keys[m]);
					}

				}
			},
			l18n : function(data){
				var keys;
				for (var k in data){
					keys = JSON.parse(data[k]);
					for (var m in keys){
						base(k + "::" + m, keys[m]);
					}

				}
			}
		},
		
	};

	return App;

});