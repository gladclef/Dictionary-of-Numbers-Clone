/**
 * A clone of the amazing Dictionary of Numbers plugin for the Chrome web browser, now for Firefox!
 * https://www.dictionaryofnumbers.com/
 * https://github.com/gladclef/Dictionary-of-Numbers-Clone
 *
 * This plugin looks for numbers and associated units in web pages, requests for approxiamately
 * equivalent values from (wolfram alpha? TODO), and embeds the responses directly in the page.
 *
 * Other features include: "value", 
 * - temporarily disable (TODO)
 * - manual query (TODO)
 */

/**
 * Makes a request to Wolfram Alpha, one for each of the given number units.
 * <p>
 * The results are added to the individual number units as the field value "wolframRequestResult".
 *
 * @param numberUnits An array of number units. Each number unit should be an object in the form:
 *        <pre>
 *        { match:"match", startIndex:position in element node, length:character count in literal text, units:"unit word", element:element node }
 *        </pre>
 * @param onSuccess The function to call when the request result is recieved. The only parameter
          is the number unit, including the "wolframRequestResult" result string.
 */
function makeRequestsForEachNumberUnit(numberUnits, onSuccess)
{
	var finishRequest = function(numberUnit, requestResultCompleteXML)
	{
		var requestResult = getRequestStringResult(requestResultCompleteXML);
		numberUnit["wolframRequestResult"] = requestResult;
		onSuccess(numberUnit);
	};

	numberUnits.forEach(function(numberUnit)
	{
		makeWolframRequest(numberUnit.match, function(requestResultCompleteXML)
		{
			finishRequest(numberUnit, requestResultCompleteXML);
		});
	});
}

console.log("hi");
var allNumberUnits = findUniqueNumbers();
console.log("got all number units");
var singleNumberUnit = [allNumberUnits[0]];
makeRequestsForEachNumberUnit(singleNumberUnit, function(numberUnit)
{
	console.log(numberUnit);
});