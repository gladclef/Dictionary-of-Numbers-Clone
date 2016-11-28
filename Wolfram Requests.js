var queryPart1 = "http://api.wolframalpha.com/v2/query?appid=";
var queryPart2 = "&includepodid=Comparison&scanner=Unit&format=plaintext&";
function makeWolframRequest(input)
{
	var query = queryPart1 + getAppId() + queryPart2 + input;

	return null;
}

function getRequestStringResult(requestResultCompleteXML)
{
	return "heck yeah";
}