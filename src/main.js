!(function(){

	requirejs.config({
		baseUrl : "src",
		paths : {
			"base" : "../node_modules/basejs/base",
			"file" : "../node_modules/requirejs-text/text",
		}
	});

	requirejs([
		"base",
		"Laya/Laya",
		"examples/Player",
		"examples/Match3",
		"examples/GoodRead",
		"../res/index"
	], function(base, laya, Player, Match3, GoodRead, resData){
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
