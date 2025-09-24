// Function that receives a string and a number and returns the nth most common words in the string as well as the frequency.
function nthMostCommon(str, amount) {

  const stickyWords =[
    "",
    "the",
    "there",
    "by",
    "at",
    "and",
    "so",
    "if",
    "than",
    "but",
    "about",
    "in",
    "on",
    "the",
    "was",
    "for",
    "that",
    "said",
    "a",
    "or",
    "of",
    "to",
    "there",
    "will",
    "be",
    "what",
    "get",
    "go",
    "think",
    "just",
    "every",
    "are",
    "it",
    "were",
    "had",
    "i",
    "very",
    "we",
    "tu",
    "isso",
    "who",
    "don't",
    "it's",
    "my",
    "do",
    "going",
    "which",
    "when",
    "not",
    "não",
    "how",
    "e",
    "é",
    "o",
    "more",
    "your",
    "is",
    "can",
    "as",
    "toda",
    "faz",
    "have",
    "this",
    "they",
    "you",
    "i'm",
    "de",
    "que",
    "an",
    "from",
    "1",
    "any",
    "you're",
    "has",
    "because"
    ];
    str= str.toLowerCase();
    var splitUp = str.split(/\s/);
    const wordsArray = splitUp.filter(function(x){
    return !stickyWords.includes(x) ;
            });
    var wordOccurrences = {}
    for (var i = 0; i < wordsArray.length; i++) {
        wordOccurrences['_'+wordsArray[i]] = ( wordOccurrences['_'+wordsArray[i]] || 0 ) + 1;
    }
    var result = Object.keys(wordOccurrences).reduce(function(acc, currentKey) {
        /* you may want to include a binary search here */
        for (var i = 0; i < amount; i++) {
            if (!acc[i]) {
                acc[i] = { word: currentKey.slice(1, currentKey.length), occurences: wordOccurrences[currentKey] };
                break;
            } else if (acc[i].occurences < wordOccurrences[currentKey]) {
                acc.splice(i, 0, { word: currentKey.slice(1, currentKey.length), occurences: wordOccurrences[currentKey] });
                if (acc.length > amount)
                    acc.pop();
                break;
            }
        }
        return acc;
    }, []);
 
    return result;
}

// Function that searches recursively for a key and a value in a nested array of objects.
function searchRecursively(arr, key, value) {
  let result = [];
  
  arr.forEach((obj) => {
    if (obj[key] === value) {
      result.push(obj);
    } else if (obj.children) {
      result = result.concat(searchRecursively(obj.children, key, value));
    }
  });
  return result;
}

module.exports = {
    nthMostCommon,
    searchRecursively,
    default: {
        nthMostCommon,
        searchRecursively
    }
};