"use strict";
define(function(){

	var Mutator = function(element, callback){
 		var observer = new MutationObserver(callback);
		var config = { attributes: true, childList: true, characterData: true };
		observer.observe(element, config);
	};

	Mutator.prototype = {
		
	};

	return Mutator;

});