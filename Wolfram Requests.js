var queryPart1 = "http://api.wolframalpha.com/v2/query?appid=";
var queryPart2 = "&includepodid=Comparison&scanner=Unit&format=plaintext&input=";
var requestResultsRemovalRegex = /\(.*?\)/g;

function makeWolframRequest(input, onSuccess)
{
	var input = encodeURIComponent(input);
	var query = queryPart1 + getAppId() + queryPart2 + input;
	console.log("query:" + query);

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function()
	{
		console.log("onreadystatechange");
		console.log(this);
		if (this.readyState == 4 && this.status == 200)
		{
			onSuccess(this.responseText);
		}
	};
	xhttp.open("GET", query, true);
	xhttp.send();
}

function getExampleRequest()
{
	var example = "";
	example += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
	example += "<queryresult success=\"true\" error=\"false\" numpods=\"1\" datatypes=\"Quantity\" timedout=\"\" timedoutpods=\"\" timing=\"0.781\" parsetiming=\"0.356\" parsetimedout=\"false\" recalculate=\"\" id=\"MSPa96602044f8h5h9ifdi2d000036g0gec1dfif431g\" host=\"http://www4f.wolframalpha.com\" server=\"54\" related=\"http://www4f.wolframalpha.com/api/v2/relatedQueries.jsp?id=MSPa96612044f8h5h9ifdi2d00003382a955150g82455377548043887378851\" version=\"2.6\">\n";
	example += " <pod title=\"Comparison\" scanner=\"Unit\" id=\"Comparison\" position=\"100\" error=\"false\" numsubpods=\"1\">\n";
	example += "  <subpod title=\"\">\n";
	example += "   <plaintext> ≈ 1.3 × current population of Monaco (≈ 30500 people )</plaintext>\n";
	example += "  </subpod>\n";
	example += " </pod>\n";
	example += " <assumptions count=\"1\">\n";
	example += "  <assumption type=\"Clash\" word=\"people\" template=\"Assuming &quot;${word}&quot; is ${desc1}. Use as ${desc2} instead\" count=\"3\">\n";
	example += "   <value name=\"Unit\" desc=\"a unit\" input=\"*C.people-_*Unit-\"/>\n";
	example += "   <value name=\"BernoulliTrial\" desc=\" referring to probabilities\" input=\"*C.people-_*BernoulliTrial-\"/>\n";
	example += "   <value name=\"ZIPCodeProperty\" desc=\" referring to ZIP codes\" input=\"*C.people-_*ZIPCodeProperty-\"/>\n";
	example += "  </assumption>\n";
	example += " </assumptions>\n";
	example += "</queryresult>\n";
	return example;
}

function getRequestStringResult(requestResultCompleteXML)
{
	console.log("getRequestStringResult: " + requestResultCompleteXML);
	var xmlDoc = (new DOMParser()).parseFromString(requestResultCompleteXML, "text/xml");
	var requestResult = xmlDoc.getElementsByTagName("plaintext")[0].childNodes[0].nodeValue;
	requestResult = requestResult.replace(requestResultsRemovalRegex, "");
	requestResult = requestResult.trim();
	return requestResult;
}