"use strict";
define(function(){

	var Mutator = function(element, callback){
		if (!(element instanceof window.Element) || typeof callback != "function"){
			return;
		}
		
 		var observer = new MutationObserver(callback);
		var config = { attributes: true, childList: true, characterData: true };
		observer.observe(element, config);
	};

	Mutator.prototype = {
		
	};

	return Mutator;

});