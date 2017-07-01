"use strict";
define(function(){

	var Wrappers = function(laya){
		this.laya = laya;
	};

	Wrappers.prototype = {
		methods : {
			additem : function(node, data){
				var itemData = node.getAttribute("data-item-layout");
				var content = this.laya.make(itemData, data);
				node.appendChild(content);
			}
		},
		"list" : function(node){
			node.addItem = this.methods.additem.bind(this, node);
		}
	};

	return Wrappers;

});
