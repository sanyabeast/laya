"use strict";
define([
		"laya/modules/LayaCore",
		"laya/modules/AttrProcessor",
		"laya/modules/CSS",
		"laya/modules/Template",
		"laya/modules/Util",
		"laya/modules/Wrappers"
	], function(LayaCore, AttrProcessor, CSS, Template, Util, Wrappers){
	
	var laya = new LayaCore(LayaCore, AttrProcessor, CSS, Template, Util, Wrappers);

	return laya;
});