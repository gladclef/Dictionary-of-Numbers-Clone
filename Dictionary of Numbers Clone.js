// /-?(?:\.|,)?\d+(?:(?:\.|,)\d+)?/g
// /                                 start of regex
//  -?                               numbers can optionally start with a minus sign "-"
//    (?:    )?                      optional non-capture group
//       \.|,                        number can start with a comma or period (eg ".123")
//             \d+                   match one or more digits
//                (?:           )?   optional non-capture group
//                   (?:    )        non-capture group
//                      \.|,         comma or period
//                           \d+     match one or more digits
//                                /  end of regex
//                                 g match all occurances in the string (not just the first occurance)
// Note: this will also capture values such as ".123,456"
var numRegex = /-?(?:\.|,)?\d+(?:(?:\.|,)\d+)?/g;
var whiteSpaceRegex = /\s/g;
var whiteSpaceOrMinusSignRegex = /\s-?/g;
var wordRegex = /[a-z][A-Z]\//g;
var defaultSkipAllowance = 0; // for unitWordTest

var cachedSimpleUnits = null;
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

	cachedSimpleUnits = units.sort(function(a, b)
	{
		return a.length - b.length;
	});
	cachedSimpleUnits = units.map(function(a)
	{
		return a.toLowerCase();
	});
	cachedSimpleUnits = cachedSimpleUnits.filter(onlyUnique);
	return cachedSimpleUnits;
}

var cachedBaseUnits = null;
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

	cachedBaseUnits = units.sort(function(a, b)
	{
		return a.length - b.length;
	});
	cachedBaseUnits = units.map(function(a)
	{
		return a.toLowerCase();
	});
	cachedBaseUnits = cachedBaseUnits.filter(onlyUnique);
	return cachedBaseUnits;
}

var cachedAllUnits = null;
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
	
	cachedPrefixes = units.map(function(a)
	{
		return a.toLowerCase();
	});
	cachedPrefixes = cachedPrefixes.filter(onlyUnique);

	return cachedPrefixes;
}

/**
 * Useful as the argument to Array.filter(...) to remove duplicates from the array.
 */
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

/**
 * Test the given haystack to determine if the given needle is a whole word,
 * or just part of another word.
 *
 * @param haystack String to search in.
 * @param needle String to search for.
 * @return True if a whole word, false if part of another word, or a string representing a unit.
 */
function wholeWordTest(haystack, needle)
{
	var tIndex = haystack.indexOf(needle);
	var unit = null;

	// immediately preceeds white space, end of text, or one of the units words
	if (haystack.length === tIndex + needle.length) {
		return true;
	}
	var nextChar = haystack.charAt(tIndex + needle.length);
	whiteSpaceRegex.lastIndex = 0;
	if (!whiteSpaceRegex.test(nextChar))
	{
		unit = unitWordTest(haystack.substr(tIndex + needle.length), defaultSkipAllowance);
		if (unit == null)
		{
			return false;
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
 * @param skipAllowance The number of words that can be skipped.
 * @return The next unit word, or null if the next word is not a unit word.
 */
function unitWordTest(haystack, skipAllowance)
{
	// caching for efficiency
	if (cachedUnitWordTestModifiedText == null ||
		cachedUnitWordTestModifiedText[0] != haystack)
	{
		cachedUnitWordTestModifiedText = [
			haystack,
			haystack.toLowerCase()
		];
		cachedUnitWordTestModifiedText[0] = cachedUnitWordTestModifiedText[0]
		.trim();
	}

	// try to match a units word in the haystack
	wordRegex.lastIndex = 0;
	var wordMatches = cachedUnitWordTestModifiedText[1].match(wordRegex);
	if (wordMatches && wordMatches.length > 0)
	{
		var nextWord = wordMatches[0];
		if (getUnits().indexOf(nextWord) < 0)
		{
			if (skipAllowance > 0)
			{
				return unitWordTest(haystack.substr(nextWord.length), skipAllowance);
			}
			return null;
		}
		return nextWord;
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
	if (element.tagName != undefined && element.tagName.toLowerCase() == "script")
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
		numRegex.lastIndex = 0;
		var matches = text.match(numRegex);
		if (matches == null || matches == undefined || matches.length == 0)
		{
			return null;
		}
		matches = matches.filter(onlyUnique);

		// verify the match is its own word and maybe associated units
		matches = matches.filter(function(value, index, self)
		{
			return wholeWordTest(text, value);
		});

		if (matches.length == 0)
		{
			return null;
		}
		return [[element].concat(matches)];
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