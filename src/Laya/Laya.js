"use strict";
define([
		"laya/modules/LayaCore",
		"laya/modules/AttrProcessor",
		"laya/modules/CSS",
		"laya/modules/Template",
		"laya/modules/Util",
		"laya/modules/Wrappers",
		"laya/modules/TagProcessor",
	], function(LayaCore, AttrProcessor, CSS, Template, Util, Wrappers, TagProcessor){

	var laya = new LayaCore(LayaCore, AttrProcessor, CSS, Template, Util, Wrappers, TagProcessor);

	return laya;
});
