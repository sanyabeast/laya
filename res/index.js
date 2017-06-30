"use strict";
define([
	"file!./l18n.json",
	"file!./layouts.json",
	"file!./skins.json",

], function(l18nJSON, layoutsJSON, skinsJSON){

	return {
		l18n : JSON.parse(l18nJSON),
		layouts : JSON.parse(layoutsJSON),
		skins : JSON.parse(skinsJSON)
	};

});