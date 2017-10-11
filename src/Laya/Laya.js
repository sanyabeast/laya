"use strict";
define([
		"laya/modules/LayaCore",
		"laya/modules/AttrProcessor",
		"laya/modules/CSS",
		"laya/modules/Template",
		"laya/modules/Util",
		"laya/modules/Wrappers",
		"laya/modules/TagProcessor",
		"laya/modules/Mutator"
	], function(LayaCore, AttrProcessor, CSS, Template, Util, Wrappers, TagProcessor, Mutator){

	var laya = new LayaCore(LayaCore, AttrProcessor, CSS, Template, Util, Wrappers, TagProcessor, Mutator);

	return laya;
});
