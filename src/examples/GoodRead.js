"use strict";
define([
		"Laya/laya",
		"base",
		"file!/res/layouts.css"
	], function(laya, base, layoutsCSS){

	function randFromArr(arr){
		return arr[Math.floor(Math.random() * arr.length)];
	};

	var App = function(resData){
		laya.setBase(base);
		this.loader.load(resData);
		laya.css.setup(layoutsCSS);

		this.skin = "default";

		this.dom = laya.make("~res.layouts.goodread::index", {

		});

		document.body.addChild(this.dom);

		this.dom.select(".playlist .list", true, function(node){

			console.log(node);

			for (var a = 0; a < 50; a++){
				node.addItem({
					artist : randFromArr(randNames),
					title : randFromArr(randNames),
					onitemclick : function(){
						console.log(arguments);
					}
				});
			}

		});

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
		set skin(name){
			var skinpath = base.path("res.skins." + name);
			for (var k in skinpath){
				base("res.skins.current::" + k, skinpath[k].value);
			}
		},
		set lang(name){
			var langpath = base.path("res.l18n." + name);

			for (var k in langpath){
				base("res.l18n.current::" + k, langpath[k].value);
			}
		}
	};

	return App;

});
