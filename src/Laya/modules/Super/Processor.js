"use strict";
define(function(){

  var Processor = function(laya){
    this.laya = laya;
  };

  Processor.prototype = {
    process : function(processorName, element, attrValue, attrName){
			this.processors[processorName].call(this, element, attrValue, attrName);
		},
		getProcessorName : function(name){
			var util = this.laya.util;
			var keys = util.keys(this.processors);

			for (var a = 0, l = keys.length, match; a < l; a++){
				match = name.match(new RegExp(keys[a]));
				if (match) return keys[a];
			}

		}
  };

  return Processor;
});
