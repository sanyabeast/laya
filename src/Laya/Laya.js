"use strict";
define([
		"./modules/LayaCore",
		"./modules/AttrProcessor",
		"./modules/CSS",
		"./modules/Template",
		"./modules/Util",
		"./modules/Wrappers"
	], function(LayaCore, AttrProcessor, CSS, Template, Util, Wrappers){
	
	var laya = new LayaCore(LayaCore, AttrProcessor, CSS, Template, Util, Wrappers);

	return laya;
});