!(function(){

	requirejs.config({
		postalUrl : "src",
		paths : {
			"postal" : "../node_modules/postaljs/postal",
			"file" : "../node_modules/requirejs-text/text",
		}
	});

	requirejs([
		"postal",
		"Laya/Laya",
		"examples/Player",
		"examples/Match3",
		"examples/GoodRead",
		"../res/index"
	], function(postal, laya, Player, Match3, GoodRead, resData){
		switch(window.example){
			case "goodread":
				window.goodread = new GoodRead(resData);
			break;
			case "match3":
				window.match3 = new Match3(resData);
			break;
			default:
				window.player = new Player(resData);
			break;
		}
	});

})();
