define([
		"./Super/Processor",
		"./Util"
], function(Processor, Util){

	var util = new Util();

  var TagProcessor = function(laya){
    this.laya = laya;
  };

  TagProcessor.prototype = {
    processors : {
      "p" : function(){
        //console.log(arguments);
      },
    },
  };

  util.inheritClass(Processor, TagProcessor);

  return TagProcessor;

});
