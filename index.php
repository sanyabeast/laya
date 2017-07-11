<?php
	$example = $_GET["example"];
?>
<!DOCTYPE html>
<html>
<head>
	<title>laya</title>
</head>
<body>
	<script>
		example = "<?php echo $example?>"
	</script>
	<script data-main="src/main" src="node_modules/requirejs/require.js"></script>
</body>
</html>
