import * as _ from 'lodash'

export const BYTE_UNITS = {
	b: { num: 1, str: 'B' },
	kb: { num: Math.pow(1000, 1), str: 'KB' },
	mb: { num: Math.pow(1000, 2), str: 'MB' },
	gb: { num: Math.pow(1000, 3), str: 'GB' },
	tb: { num: Math.pow(1000, 4), str: 'TB' },
	pb: { num: Math.pow(1000, 5), str: 'PB' },
	eb: { num: Math.pow(1000, 6), str: 'EB' },
	zb: { num: Math.pow(1000, 7), str: 'ZB' },
	yb: { num: Math.pow(1000, 8), str: 'YB' },
	kib: { num: Math.pow(1024, 1), str: 'KiB' },
	mib: { num: Math.pow(1024, 2), str: 'MiB' },
	gib: { num: Math.pow(1024, 3), str: 'GiB' },
	tib: { num: Math.pow(1024, 4), str: 'TiB' },
	pib: { num: Math.pow(1024, 5), str: 'PiB' },
	eib: { num: Math.pow(1024, 6), str: 'EiB' },
	zib: { num: Math.pow(1024, 7), str: 'ZiB' },
	yib: { num: Math.pow(1024, 8), str: 'YiB' },
}

export const UPLOADERS = [
	'amiable',
	'ctrlhd',
	'dimension',
	'epsilon',
	'esir',
	'etrg',
	'exkinoray',
	'geckos',
	'grym',
	'inspirit',
	'kralimarko',
	'memento',
	'publichd',
	'rartv',
	'rovers',
	'sigma',
	'sparks',
	'swtyblz',
	'tasted',
	'terminal',
	'trollhd',
]

export const VIDEOS = ['avi', 'm4a', 'mkv', 'mov', 'mp4', 'mpeg', 'webm', 'wmv']

export const STOPS = ['&', 'a', 'an', 'and', 'in', 'of', 'the', 'to']

export const COMMONS = _.uniq([
	...STOPS,
	'a',
	'able',
	'about',
	'across',
	'after',
	'all',
	'almost',
	'also',
	'am',
	'among',
	'an',
	'and',
	'another',
	'any',
	'are',
	'as',
	'at',
	'be',
	'because',
	'been',
	'before',
	'being',
	'between',
	'both',
	'but',
	'by',
	'came',
	'can',
	'cannot',
	'come',
	'could',
	'dear',
	'did',
	'do',
	'does',
	'each',
	'either',
	'else',
	'ever',
	'every',
	'for',
	'from',
	'get',
	'got',
	'had',
	'has',
	'have',
	'he',
	'her',
	'here',
	'hers',
	'him',
	'himself',
	'his',
	'how',
	'however',
	'i',
	'if',
	'in',
	'into',
	'is',
	'it',
	'its',
	'just',
	'least',
	'let',
	'like',
	'likely',
	'make',
	'many',
	'may',
	'me',
	'might',
	'more',
	'most',
	'much',
	'must',
	'my',
	'neither',
	'never',
	'no',
	'nor',
	'not',
	'now',
	'of',
	'off',
	'often',
	'on',
	'only',
	'or',
	'other',
	'our',
	'out',
	'over',
	'own',
	'rather',
	'said',
	'same',
	'say',
	'says',
	'see',
	'she',
	'should',
	'since',
	'so',
	'some',
	'still',
	'such',
	'take',
	'than',
	'that',
	'the',
	'their',
	'them',
	'then',
	'there',
	'these',
	'they',
	'this',
	'those',
	'through',
	'tis',
	'to',
	'too',
	'twas',
	'under',
	'up',
	'us',
	'very',
	'wants',
	'was',
	'way',
	'we',
	'well',
	'were',
	'what',
	'when',
	'where',
	'which',
	'while',
	'who',
	'whom',
	'why',
	'will',
	'with',
	'would',
	'yet',
	'you',
	'your',
])
