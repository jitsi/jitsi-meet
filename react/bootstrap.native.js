// https://github.com/software-mansion/react-native-gesture-handler/issues/320#issuecomment-443815828
import 'react-native-gesture-handler';

// Apply all necessary polyfills as early as possible to make sure anything imported henceforth
// sees them.
import 'react-native-get-random-values';
import './features/mobile/polyfills';
