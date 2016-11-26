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
var currencyRegex = /[\$]/g;
var numbersMaybeWithCurrencyRegex = /-?\$?(?:\.|,)?\d+(?:(?:\.|,)\d+)?/g;
var whiteSpaceOrPunctuationRegex = /[\s\.!\?'"]/g;
var whiteSpaceOrMinusSignRegex = /[\s-]+/g;
var wordRegex = /[a-zA-Z\/]+/g;
var defaultSkipAllowance = 0; // for unitWordTest
var ignoreTags = [ "script", "head", "meta", "style" ];

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

	// some simple units, forgot where I got them
	var units = [ "acre", "attosecond", "average Julian calendar year", "B", "bar", "Bar", "byte", "ca", "candela", "candlestick", "centiare", "centigram", "centiliter", "centimeter", "cg", "cl", "cm", "cubic decimeter", "cubic inch", "cubic yard", "cwt", "dm", "dry pint", "EB", "exabyte", "Fahrenheit", "foot", "ft", "g", "gallon us", "GHz", "gigabyte", "Gigahertz", "grad", "Grad", "grain", "gram", "ha", "hectare", "Hectopascal", "hour", "hPa", "in", "kcal", "kg", "KHz", "Kilocalorie", "kilogram", "Kilohertz", "Kilojoule", "Kilowatt-hour", "KJ", "knot", "kWh", "lb", "leap year", "liter", "lumen", "m", "MB", "mbar", "megabyte", "meter", "microgramicrosecond", "mile", "Millibar", "Minute of arc", "nautical mile", "nautical mile/h", "Pascal", "petabyte", "picosecond", "pint", "pound avoirdupois", "Pounds per square inch", "Psi", "pt", "Ra", "Rankine", "Reaumur", "s", "second", "Second of arc", "short hundredweight", "short ton", "square centimeter", "square foot", "square inch", "square meter", "stone", "TB", "terabyte", "Therm amricain", "thm", "ton", "week", "yd", "zettabyte" ];

	// include all units
	cachedSimpleUnits = [];
	cachedSimpleUnits = cachedSimpleUnits.concat(units);

	cachedSimpleUnits.sort(function(a, b)
	{
		return a.length - b.length;
	});
	cachedSimpleUnits = cachedSimpleUnits.map(function(a)
	{
		return a.toLowerCase();
	});
	cachedSimpleUnits = cachedSimpleUnits.concat(cachedSimpleUnits.map(appendLetterS));
	cachedSimpleUnits = cachedSimpleUnits.filter(onlyUnique);
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

	// https://en.wikipedia.org/wiki/International_System_of_Units
	var siUnits = [ "A", "ampere", "becquerel", "Bq", "c", "candela", "cd", "celsiuS", "coulomb", "degree", "f", "farad", "gray", "Gy", "h", "henry", "hertz", "Hz", "j", "joule", "K", "kat", "katal", "kelvin", "kg", "kilogram", "lm", "lumen", "lux", "lx", "m", "metre", "mol", "mole", "n", "newton", "ohm", "Pa", "pascal", "rad", "radian", "s", "s", "second", "siemens", "sievert", "sr", "steradian", "Sv", "t", "tesla", "v", "volt", "w", "watt", "Wb", "weber" ];

	// include all units
	cachedBaseUnits = [];
	cachedBaseUnits = cachedBaseUnits.concat(siUnits);

	cachedBaseUnits.sort(function(a, b)
	{
		return a.length - b.length;
	});
	cachedBaseUnits = cachedBaseUnits.map(function(a)
	{
		return a.toLowerCase();
	});
	cachedBaseUnits = cachedBaseUnits.concat(cachedBaseUnits.map(appendLetterS));
	cachedBaseUnits = cachedBaseUnits.filter(onlyUnique);
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
	var prefixes = [ "deca", "hecto", "kilo", "mega", "giga", "tera", "peta", "exa", "zetta", "yotta", "da", "h", "k", "M", "G", "T", "P", "E", "Z", "Y" ];

	cachedPrefixes = [];
	cachedPrefixes = cachedPrefixes.concat(prefixes);
	
	cachedPrefixes = cachedPrefixes.map(function(a)
	{
		return a.toLowerCase();
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
 * Test the given haystack to determine if the given needle is a whole word,
 * or just part of another word.
 * <p>
 * Definition of a whole word is:
 * 1a. needle is the first thing in the haystack, or
 * 1b. needle follows white space
 * 2a. needle is the last thing in the haystack
 * 2b. needle immediately preceeds white space
 * 2c. needle is followed by a unit, according to {@link unitWordTest(String, int, int)}
 *
 * @param haystack String to search in.
 * @param needle String to search for.
 * @return True if a whole word, false if part of another word, or a string representing a unit.
 */
function wholeWordTest(haystack, needle)
{
	var tIndex = haystack.indexOf(needle);
	var unit = null;

	// immediately preceeds white space, end of text, punctuation, or one of the units words
	if (haystack.length !== tIndex + needle.length) { // end of text
		var nextChar = haystack.charAt(tIndex + needle.length);
		whiteSpaceOrPunctuationRegex.lastIndex = 0;
		if (!whiteSpaceOrPunctuationRegex.test(nextChar)) // white space or punctuation
		{
			unit = unitWordTest(haystack, tIndex + needle.length, defaultSkipAllowance);  // unit word
			if (unit == null)
			{
				return false;
			}
		}
	}

	// it's the first thing in the haystack
	if (tIndex === 0) {
		return (unit != null) ? unit : true;
	}

	// immediately follows white space or a minus sign preceeded by white space
	var previousChar = haystack.charAt(tIndex - 1);
	whiteSpaceOrMinusSignRegex.lastIndex = 0;
	if (whiteSpaceOrMinusSignRegex.test(previousChar))
	{
		return (unit != null) ? unit : true;
	}

	return false;
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
		cachedUnitWordTestModifiedText[1] = cachedUnitWordTestModifiedText[1].toLowerCase();
	}

	// string to operate upon
	var subWord = cachedUnitWordTestModifiedText[1].substr(startIndex);
	if (!subWord || subWord.length == 0)
	{
		return null;
	}

	// find the next word
	wordRegex.lastIndex = startIndex;
	var wordMatches = subWord.match(wordRegex);
	var nextWord = null;
	if (wordMatches && wordMatches.length > 0)
	{
		nextWord = wordMatches[0];
	}
	else
	{
		return null;
	}

	// try to match an exact unit word against the next word
	if (getAllUnits().indexOf(nextWord) > 0)
	{
		return nextWord;
	}

	// try to match prefix + base units against the next word
	var prefixesByLength = getPrefixesByLength();
	for (var i = 0; i < prefixesByLength.length; i++)
	{
		var prefixes = prefixesByLength[prefixesByLength.length - 1 - i];
		var preWord = nextWord.substr(0, prefixes[0].length);
		if (prefixes.indexOf(preWord) >= 0)
		{
			var remainingWord = nextWord.substr(preWord.length);
			if (getBaseUnits().indexOf(remainingWord) >= 0)
			{
				return nextWord;
			}
		}
	}
	
	// try to match the next next word
	if (skipAllowance > 0)
	{
		return unitWordTest(haystack, startIndex + nextWord.length, skipAllowance);
	}

	return null;
}

function findNumbers(element)
{
	var retval = null;

	if (element == null || element == undefined)
	{
		element = document;
	}
	if (element.tagName != undefined && ignoreTags.indexOf(element.tagName.toLowerCase()) >= 0)
	{
		return null;
	}
	if (element.nodeType == Node.TEXT_NODE)
	{
		var text = element.wholeText.trim();
		if (text.length == 0)
		{
			return null;
		}
		numbersMaybeWithCurrencyRegex.lastIndex = 0;
		var numberMatches = text.match(numbersMaybeWithCurrencyRegex);
		if (numberMatches == null || numberMatches == undefined || numberMatches.length == 0)
		{
			return null;
		}
		numberMatches = numberMatches.filter(onlyUnique);

		// verify the match is its own word and maybe associated units
		var unit = null;
		numberMatches = numberMatches.filter(function(value, index, self)
		{
			var wholeWordTestResults = wholeWordTest(text, value);
			if (wholeWordTestResults === false || wholeWordTestResults === null)
			{
				return false;
			}
			if (wholeWordTestResults === true)
			{
				return true;
			}
			unit = wholeWordTestResults;
			return true;
		});

		if (numberMatches.length == 0)
		{
			return null;
		}
		return [[element, numberMatches, unit]];
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

console.log("hi");
console.log(findNumbers());