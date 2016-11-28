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

// /-?\$?(?:\.|,)?\d+(?:(?:\.|,)\d+)?/g
// /                                    start of regex
//  -?                                  numbers can optionally start with a minus sign "-"
//    \$?                               numbers can optionally start with a currency symbol
//       (?:    )?                      optional non-capture group
//          \.|,                        number can start with a comma or period (eg ".123")
//                \d+                   match one or more digits
//                   (?:           )?   optional non-capture group
//                      (?:    )        non-capture group
//                         \.|,         comma or period
//                              \d+     match one or more digits
//                                   /  end of regex
//                                    g match all occurances in the string (not just the first occurance)
// Note: this will also capture values such as ".123,456"
var numbersMaybeWithCurrencyRegex = /-?\$?(?:\.|,)?\d+(?:(?:\.|,)\d+)?/g;
var numbersInRatioRegex = /-?\d+\/\d+/g;
var whiteSpaceRegex = /[\s]/g;
var multiWhiteSpaceRegex = /[\s]+/g;
var punctuationRegex = /[\.!\?"']/g;
var numBoundaryRegex = /[\s"\.\\\(\)"',;<>~!*+=\[\]\{\}`\?]-?/g;
var wordRegex = /[a-zA-Z\/]+/g;
var twoWordRegex = /[a-zA-Z\/]+[\s]+[a-zA-Z\/]+/g;
var defaultSkipAllowance = 0; // for unitWordTest
var ignoreTags = [ "script", "head", "meta", "style" ];

var currencyRegex = /[\$]/g;
var currencyMap =
{
	"$": "dollars"
};

/**
 * Useful as the argument to Array.filter(...) to remove duplicates from the array.
 */
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

/**
 * Returns a as (a + "s") for any a that doesn't already end in "s".
 * <p>
 * Useful in the use case of Array.concat(Array.map(...)).filter(onlyUnique).
 */
function appendLetterS(a)
{
	return (a.charAt(a.length - 1) == "s") ? a : a + "s";
}

/**
 * Used to normalize the given string, so that comparison is easier to do.
 * <p>
 * This does the following:
 * <ul>
 *     <li> replaces white space characters with a single space
 *     <li> replaces special unicode variants of characters to a base character (TODO)
 *     <li> converts to lower case
 * <p>
 * The number of characters is preserved.
 */
function normalize(str)
{
	return str.toLowerCase().replace(whiteSpaceRegex, " ");
}

var cachedSimpleUnits = null;
/**
 * Units that just match. No special tricks.
 * 
 * @see #getAllUnits()
 * @see #getBaseUnits()
 */
function getSimpleUnits()
{
	// caching for efficiency
	if (cachedSimpleUnits != null)
	{
		return cachedSimpleUnits;
	}

	// http://converticious.com/units-list.php, heavily modified
	var units = [ "acre", "attosecond", "average Julian calendar year", "byte", "calendar year", "candlestick", "centiare", "centigram", "centiliter", "centimeter", "cg", "cm", "degrees Fahrenheit", "dry pint", "Fahrenheit", "foot", "ft", "gallon us", "grad", "Grad", "ha", "hectare", "Hectopascal", "hour", "hPa", "in", "kcal", "Kilocalorie", "KJ", "knot", "kWh", "lb", "leap year", "liter", "lumen", "microgramicrosecond", "mile", "Minute of arc", "nautical mile", "nautical mile/h", "picosecond", "pint", "pound avoirdupois", "Pounds per square inch", "Psi", "Ra", "Rankine", "Reaumur", "Second of arc", "short hundredweight", "short ton", "square centimeter", "stone", "Therm amricain", "thm", "ton", "week", "yd" ];
	var unitsSquareCubic = [ "cubic centimeter", "cubic decimeter", "cubic foot", "cubic inch", "cubic meter", "cubic mile", "cubic kilometer", "cubic yard", "cu cm", "cu dm", "cu ft", "cu in", "cu m", "cu km", "cu yd", "square decimeter", "square foot", "square inch", "square meter", "square mile", "square kilometer", "square yard", "sq dm", "sq ft", "sq in", "sq m", "sq km", "sq yd" ];
	// from my head
	var head = [ "adult", "child", "children", "dollar", "euro", "person", "people", "pound" ];
	// deemed too difficult to match
	var rejects = [ "cl", "dm", "grain", "pt" ];

	// include all units
	cachedSimpleUnits = [];
	cachedSimpleUnits = cachedSimpleUnits.concat(units);
	cachedSimpleUnits = cachedSimpleUnits.concat(unitsSquareCubic);
	cachedSimpleUnits = cachedSimpleUnits.concat(head);

	cachedSimpleUnits = cachedSimpleUnits.map(function(a)
	{
		return normalize(a);
	});
	cachedSimpleUnits = cachedSimpleUnits.concat(cachedSimpleUnits.map(appendLetterS));
	cachedSimpleUnits = cachedSimpleUnits.filter(onlyUnique);
	cachedSimpleUnits.sort(function(a, b)
	{
		return b.length - a.length;
	});
	return cachedSimpleUnits;
}

var cachedBaseUnits = null;
/**
 * These unit strings can be used in combination with prefixes.
 * 
 * @see #getAllUnits()
 * @see #getSimpleUnits()
 */
function getBaseUnits()
{
	// caching for efficiency
	if (cachedBaseUnits != null)
	{
		return cachedBaseUnits;
	}

	// https://en.wikipedia.org/wiki/International_System_of_Units, heavily modified
	var siUnits = [ "amp", "ampere", "ANSI lumens", "becquerel", "byte", "candela", "celsiuS", "coulomb", "degree", "degrees celsiuS", "farad", "gram", "gray", "henry", "hertz", "joule", "katal", "kelvin", "kilogram", "lumen", "metre", "mole", "newton", "ohm", "pascal", "peak lumens", "radian", "second", "siemens", "sievert", "steradian", "tesla", "volt", "watt", "weber" ];
	// from my head
	var head = [ "watt-hour" ];
	// same as above, but don't tack on the extra "s"
	var siUnitsNoS = [ "b", "Bq", "cd", "g", "Gy", "Hz", "j", "kat", "kg", "lm", "lux", "lx", "m", "mol", "n", "Pa", "rad", "sr", "Sv", "v", "w", "Wb", "Wh" ];
	// deemed too difficult to match
	var rejects = [ "A", "c", "f", "h", "K", "s", "s", "t" ];

	// include all units
	cachedBaseUnits = [];
	cachedBaseUnits = cachedBaseUnits.concat(siUnits);
	cachedBaseUnits = cachedBaseUnits.concat(head);
	cachedBaseUnits = cachedBaseUnits.concat(siUnitsNoS);

	cachedBaseUnits = cachedBaseUnits.map(function(a)
	{
		return normalize(a);
	});
	cachedBaseUnits = cachedBaseUnits.concat(cachedBaseUnits.map(function(a) {
		return (siUnitsNoS.indexOf(a) >= 0) ? a : appendLetterS(a);
	}));
	cachedBaseUnits = cachedBaseUnits.filter(onlyUnique);
	cachedBaseUnits.sort(function(a, b)
	{
		return b.length - a.length;
	});
	return cachedBaseUnits;
}

var cachedAllUnits = null;
/**
 * A combination of the units from {@link #getSimpleUnits()} and {@link #getBaseUnits()}.
 */
function getAllUnits()
{
	// caching for efficiency
	if (cachedAllUnits != null)
	{
		return cachedAllUnits;
	}

	cachedAllUnits = [];
	cachedAllUnits = cachedAllUnits.concat(getSimpleUnits());
	cachedAllUnits = cachedAllUnits.concat(getBaseUnits());

	cachedAllUnits = cachedAllUnits.filter(onlyUnique);

	return cachedAllUnits;
}

var cachedPrefixes = null;
/**
 * Prefixes to prepend to values from {@link #getBaseUnits()}.
 * 
 * @see #getPrefixesByLength()
 */
function getPrefixes()
{
	// caching for efficiency
	if (cachedPrefixes != null)
	{
		return cachedPrefixes;
	}

	// https://en.wikipedia.org/wiki/International_System_of_Units
	var prefixes = [ "deca", "hecto", "kilo", "mega", "giga", "tera", "peta", "exa", "zetta", "yotta", "h", "k", "M", "G", "T", "P", "Z", "Y" ];
	// deemed too difficult to match
	var rejects = [ "da", "E" ];

	cachedPrefixes = [];
	cachedPrefixes = cachedPrefixes.concat(prefixes);
	
	cachedPrefixes = cachedPrefixes.map(function(a)
	{
		return normalize(a);
	});
	cachedBaseUnits.sort(function(a, b)
	{
		return a.length - b.length;
	});
	cachedPrefixes = cachedPrefixes.filter(onlyUnique);

	return cachedPrefixes;
}

var cachedPrefixesByLength = null;
/**
 * @return The values from {@link #getPrefixes()}, sorted into different arrays according to length.
 */
function getPrefixesByLength()
{
	// caching for efficiency
	if (cachedPrefixesByLength != null)
	{
		return cachedPrefixesByLength;
	}

	cachedPrefixesByLength = [];
	var prefixes = getPrefixes();
	prefixes.sort(function(a, b) {
		return a.length - b.length;
	});
	var lastLength = 0;
	for (var i = 0; i < prefixes.length; i++)
	{
		var prefix = prefixes[i];
		if (prefix.length > lastLength)
		{
			cachedPrefixesByLength.push([]);
			lastLength = prefix.length;
		}
		cachedPrefixesByLength[cachedPrefixesByLength.length - 1].push(prefix);
	}

	return cachedPrefixesByLength;
}

var cachedUnitWordTestModifiedText = null;
/**
 * Determine if the first word in the given haystack is a unit word.
 *
 * @param haystack String to search in.
 * @param startIndex The index to start searching at.
 * @param skipAllowance The number of words that can be skipped.
 * @return The next unit word, or null if the next word is not a unit word.
 */
function unitWordTest(haystack, startIndex, skipAllowance)
{
	// caching for efficiency
	if (cachedUnitWordTestModifiedText == null ||
		cachedUnitWordTestModifiedText[0] != haystack)
	{
		cachedUnitWordTestModifiedText = [
			haystack,
			haystack
		];
		cachedUnitWordTestModifiedText[1] = normalize(cachedUnitWordTestModifiedText[1]);
	}

	// string to operate upon
	var subWord1 = cachedUnitWordTestModifiedText[1].substr(startIndex);
	if (!subWord1 || subWord1.length == 0)
	{
		return null;
	}
	multiWhiteSpaceRegex.lastIndex = 0;
	var multiWhiteSpaceMatches = subWord1.match(multiWhiteSpaceRegex);
	var subWord2 = subWord1;
	if (multiWhiteSpaceMatches && multiWhiteSpaceMatches.length > 0 && subWord1.indexOf(multiWhiteSpaceMatches[0]) == 0)
	{
		subWord2 = subWord1.substr(multiWhiteSpaceMatches[0].length);
		if (!subWord2 || subWord2.length == 0)
		{
			return null;
		}
	}

	// find the next word
	var regexes = [ twoWordRegex, wordRegex ];
	for (var regexIndex = 0; regexIndex < regexes.length; regexIndex++)
	{
		var wordRegexInstance = regexes[regexIndex];
		wordRegexInstance.lastIndex = startIndex;
		var wordMatches = subWord2.match(wordRegexInstance);

		var nextWord = null;
		if (wordMatches && wordMatches.length > 0)
		{
			if (subWord2.indexOf(wordMatches[0]) !== 0)
			{
				continue;
			}
			nextWord = wordMatches[0];
		}
		else
		{
			continue;
		}

		// try to match an exact unit word against the next word
		if (getAllUnits().indexOf(nextWord) > 0)
		{
			return nextWord;
		}

		// try to match prefix + base units against the next word
		var baseUnits = getBaseUnits();
		var prefixesByLength = getPrefixesByLength();
		for (var i = 0; i < prefixesByLength.length; i++)
		{
			var prefixes = prefixesByLength[prefixesByLength.length - 1 - i];
			var preWord = nextWord.substr(0, prefixes[0].length);
			if (prefixes.indexOf(preWord) >= 0)
			{
				var remainingWord = nextWord.substr(preWord.length);
				if (baseUnits.indexOf(remainingWord) >= 0)
				{
					return nextWord;
				}
			}
		}
		
		// try to match the next next word
		if (skipAllowance > 0)
		{
			var nextIndexTry = unitWordTest(haystack, startIndex + nextWord.length, skipAllowance);
			if (nextIndexTry !== null)
			{
				return nextIndexTry;
			}
		}
	}

	return null;
}

/**
 * Test the given haystack to determine if the given needle is a whole word,
 * or just part of another word.
 * <p>
 * Definition of a whole word is:
 * 1a. needle is the first thing in the haystack, or
 * 1b. needle follows a number boundary
 * 2a. needle immediately preceeds white space
 * 2b. needle is followed by a unit, according to {@link unitWordTest(String, int, int)}
 * 2c. needle starts with a currency symbol and preceeds punctuation
 *
 * @param haystack String to search in.
 * @param needle String to search for.
 * @param startIndex The index to start searching for the needle at.
 * @return A map with two values:
 *         <pre>
 *         {
 *             value: true/false/string (true if a whole word, false if part of another word, or a string representing a unit),
 *             index: the index of the match, maybe
 *         }
 *         </pre>
 */
function wholeWordTest(haystack, needle, startIndex)
{
	var tIndex = haystack.indexOf(needle, startIndex);
	var unit = null;
	var retval = { value: false, index: tIndex };

	// 2 immediately preceeds white space or one of the units words

	// end of text
	var atEnd = (haystack.length === tIndex + needle.length);

	// 2a preceeds white space
	var nextChar = (!atEnd) ? haystack.charAt(tIndex + needle.length) : ":(";
	whiteSpaceRegex.lastIndex = 0;
	if (!whiteSpaceRegex.test(nextChar))
	{
		// 2b preceeds a unit word
		unit = (!atEnd) ? unitWordTest(haystack, tIndex + needle.length, defaultSkipAllowance) : null;
		if (unit == null)
		{
			// 2c starts with a currency symbol
			currencyRegex.lastIndex = 0;
			punctuationRegex.lastIndex = 0;
			var currencyMatches = needle.match(currencyRegex);
			if (currencyMatches === null || currencyMatches.length === 0 || !punctuationRegex.test(nextChar))
			{
				return retval;
			}

			unit = currencyMap[currencyMatches[0]];
			retval.value = unit;
		}
	}

	// 1 immediately follows white space or is at the beggining of the text

	// 1a it's the first thing in the haystack
	if (tIndex === 0)
	{
		if (unit === null)
		{
			retval.value = true;
		}
		return retval;
	}

	// 1b immediately follows white space or other number boundary
	var previousChar = haystack.charAt(tIndex - 1);
	numBoundaryRegex.lastIndex = 0;
	if (numBoundaryRegex.test(previousChar))
	{
		if (unit === null)
		{
			retval.value = true;
		}
		return retval;
	}

	return retval;
}

/**
 * Find unit values for the given needle.
 * <p>
 * There are two use cases we are looking for:
 * <ul>
 *     <li> number "unit word"
 *     <li> (-?)$number[.!?"']?
 * </ul>
 * <p>
 * TODO: this currently does not discern the difference between these three instances of "1":<br>
 * "foo1bar 1 yard $1."
 * 
 * @param haystack The string to search for needle within.
 * @param needle The value to search for. Will match {@link #numbersMaybeWithCurrencyRegex}.
 * @return An array of match objects, with matches/positions/lengths/units:
 *         <pre>
 *         [
 *             { match:"match", startIndex:position in element node, length:character count in literal text, units:"unit word" },
 *             ...
 *         ]
 *         </pre>
 */
function findUnitsForWholeWord(haystack, needle, index)
{
	var nextIndex = haystack.indexOf(needle, index);

	// sanity check
	if (nextIndex < 0)
	{
		return [];
	}

	// currency check (case: (-?)$number[.!?"']?)
	currencyRegex.lastIndex = 0;
	var currencyMatches = needle.match(currencyRegex);
	if (currencyMatches !== null && currencyMatches.length > 0)
	{
		var currencyMatch = currencyMatches[0];
		var currencyUnit = currencyMap[currencyMatch];
		var match = needle.substr(currencyMatch.length) + " " + currencyUnit;
		return [{
			"match": match,
			"startIndex": nextIndex,
			"length": needle.length,
			"units": currencyUnit
		}];
	}

	// unit check (case: number "unit word")
	var subWord = haystack;
	subWord = subWord.substr(nextIndex + needle.length);
	subWord = subWord.trim();
	var unit = unitWordTest(subWord, 0, 0);
	if (unit !== null)
	{
		var unitPos = normalize(haystack).indexOf(normalize(unit), nextIndex);
		var match = haystack.substr(nextIndex, unitPos + unit.length - nextIndex);
		return [{
			"match": match,
			"startIndex": nextIndex,
			"length": (unitPos - nextIndex) + unit.length,
			"units": unit
		}];
	}

	return [];
}

/**
 * Finds all numbers in the given element, searching through nested child elemente recursively
 * until all elements have been searched.
 * <p>
 * Returns a set of those elements with numbers with matching units, as according to the two
 * method {@link #wholeWordTest(...)} and {@link #findUnits(...)}.
 * 
 * @param element The element to search through, recursively. Starts with the document if null or
 *                undefined.
 * @return An array of match sets. Each match set is an array with the following values:
 *         <pre>
 *         [
 *             { match:"match", startIndex:position in element node, length:character count in literal text, units:"unit word", element:element node },
 *             ...
 *         ]
 *         </pre>
 */
function findNumbers(element)
{
	var retval = null;

	if (element == null || element == undefined)
	{
		element = document;
	}
	if (element.tagName != undefined && ignoreTags.indexOf(normalize(element.tagName)) >= 0)
	{
		return null;
	}
	if (element.nodeType == Node.TEXT_NODE)
	{
		var text = element.wholeText;
		if (text.trim().length == 0)
		{
			return null;
		}

		// find number matches
		numbersMaybeWithCurrencyRegex.lastIndex = 0;
		numbersInRatioRegex.lastIndex = 0;
		var regularNumberMatches = text.match(numbersMaybeWithCurrencyRegex);
		var numbersInRatioMatches = text.match(numbersInRatioRegex);
		var numberMatches = [];
		numberMatches = (regularNumberMatches !== null) ? numberMatches.concat(regularNumberMatches) : numberMatches;
		numberMatches = (numbersInRatioMatches !== null) ? numberMatches.concat(numbersInRatioMatches) : numberMatches;
		numberMatches = numberMatches.sort();

		// verify the match is its own word and maybe associated units
		var unit = null;
		var prevValue = "";
		var prevIndex = 0;
		var numberMatchesWithPositionAndUnits = numberMatches.map(function(value)
		{
			var searchIndex = (normalize(prevValue) === normalize(value)) ? prevIndex + 1 : 0;
			var wholeWordTestResults = wholeWordTest(text, value, searchIndex);
			var wholeWordTestValue = wholeWordTestResults.value;
			prevIndex = wholeWordTestResults.index;
			prevValue = value;

			if (wholeWordTestValue === false || wholeWordTestValue === null)
			{
				return null;
			}
			else if (wholeWordTestValue === true)
			{
				var unitsForWholeWord = findUnitsForWholeWord(text, value, prevIndex);
				if (unitsForWholeWord.length > 0)
				{
					return unitsForWholeWord;
				}
				return null;
			}
			else
			{
				unit = wholeWordTestValue;
				var valuePos = text.indexOf(value);
				var valueStr = text.substr(valuePos);
				var unitPos = normalize(valueStr).indexOf(normalize(unit));
				var match = valueStr.substr(0, unitPos + unit.length);
				return [{
					"match": match,
					"startIndex": valuePos,
					"length": (unitPos - valuePos) + unit.length,
					"units": unit
				}];
			}
		});
		numberMatchesWithPositionAndUnits = numberMatchesWithPositionAndUnits.filter(function(a)
		{
			return a !== null;
		});

		if (numberMatchesWithPositionAndUnits.length == 0)
		{
			return null;
		}

		// collapse all arrays of matches into a single array of matches
		var collapsedMatches = [];
		for (var i = 0; i < numberMatchesWithPositionAndUnits.length; i++)
		{
			collapsedMatches = collapsedMatches.concat(numberMatchesWithPositionAndUnits[i]);
		}

		// add the element reference to each match
		collapsedMatches.forEach(function(a)
		{
			a["element"] = element;
		});

		return [collapsedMatches];
	}
	if (element.childNodes != null && element.childNodes != undefined && element.childNodes.length > 0)
	{
		for (var i = 0; i < element.childNodes.length; i++)
		{
			var other = findNumbers(element.childNodes[i]);
			if (other != null)
			{
				if (retval == null)
				{
					retval = [];
				}
				retval = retval.concat(other);
			}
		}
	}
	return retval;
}

/**
 * Filters the results from {@link #findNumbers(...)} to only contain unique unit/number
 * combinations.
 * 
 * @return An array of matches. Each match is an object with the following values:
 *         <pre>
 *         { match:"match", startIndex:position in element node, length:character count in literal text, units:"unit word", element:element node }
 *         </pre>
 */
function findUniqueNumbers()
{
	var arraysOfMatches = findNumbers();

	// flatten into single array
	var matches = [];
	arraysOfMatches.forEach(function(a)
	{
		matches = matches.concat(a);
	});

	// get all match texts
	var matchTexts = [];
	matches.forEach(function(a)
	{
		matchTexts.push(normalize(a["match"]));
	});

	// filter to only include the first instance of each match text
	matches = matches.filter(function(value, index, self)
	{
	    return matchTexts.indexOf(normalize(value["match"])) === index;
	});

	return matches;
}

console.log("hi");
console.log(findUniqueNumbers());