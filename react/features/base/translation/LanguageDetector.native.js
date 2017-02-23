import locale from 'react-native-locale-detector';

/**
 * A language detector that uses native locale.
 */
export default {
    init: Function.prototype,
    type: 'languageDetector',
    detect: () => locale,
    cacheUserLanguage: Function.prototype
};
