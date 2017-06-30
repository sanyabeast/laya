"use strict";
define([
		"Laya/laya",
		"base",
		"file!../res/layouts.css"
	], function(laya, base, layoutsCSS){

	var randNames = ["Katharina", "Scheele",
					 "Raeann", "Vanarsdale",
					 "Alfreda", "Miceli",
					 "German", "Grunewald",
					 "Ellena", "Thon",
					 "Laurene", "Journey",
					 "Rachell", "Conklin",
					 "Tifany", "Hirsh",
					 "Marietta", "Clardy",
					 "Dylan", "Basilio",
					 "Ahmed", "Harbison",
					 "Brain", "Ziglar",
					 "Clifton", "Demoss",
					 "Celine", "Demay",
					 "Alfred", "Chitwood",
					 "Elinor", "Casseus",
					 "Daria", "Lu",
					 "Kenda", "Denison",
					 "Keenan", "Nardi",
					 "Manda", "Longenecker",
					 "Darell", "Castle",
					 "Norene", "Popp",
					 "Magen", "Husband",
					 "Hermina", "Jim",
					 "Tommy", "Krider",
					 "Meg", "Guess",
					 "Chun", "Suhr",
					 "Nestor", "Tedeschi",
					 "Jacalyn", "Blatt",
					 "Wilhemina", "Stoneham",
					 "Jeannine", "Trollinger",
					 "Teena", "Friesen",
					 "Carlee", "Amador",
					 "Beau", "Pina",
					 "Portia", "Queener",
					 "Lona", "Tweedy",
					 "Irina", "Lobb",
					 "Bev", "Lira",
					 "Fabian", "Brode",
					 "Vernon", "Sabat",
					 "Vicenta", "Mullinax",
					 "Ivelisse", "Alsop",
					 "Jennefer", "Bergeron",
					 "Deb", "Julien",
					 "Lila", "Duchene",
					 "Bob", "Signorelli",
					 "Katherin", "Boon",
					 "Nida", "Gonsales",
					 "Hisako", "Hassell",
					 "Jayna", "Mumper"];

	function randFromArr(arr){
		return arr[Math.floor(Math.random() * arr.length)];
	};

	var App = function(resData){
		laya.setBase(base);
		this.loader.load(resData);
		laya.css.setup(layoutsCSS);
		this.dom = laya.make("~res.layouts.player::index", {

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

	};

	return App;

});
