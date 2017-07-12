"use strict";
define(function(){

  var Processor = function(laya){
    this.laya = laya;
  };

  Processor.prototype = {
    process : function(processorName, element, attrValue, attrName, userData){
			this.processors[processorName].call(this, element, attrValue, attrName, userData);
      return element;
		},
		getProcessorName : function(name){
			var util = this.laya.util;
			var keys = util.keys(this.processors);
      var result;

			for (var a = 0, l = keys.length, match; a < l; a++){
				match = name.match(new RegExp(keys[a]));
				if (match){
          if (!result || keys[a].length > result.length){
            result = keys[a];
          }
        }
			}

      return result;

		},
    addProcessor : function(name, command){
      this.processors[name] = command;
    }
  };

  return Processor;
});
