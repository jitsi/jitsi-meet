// The type field of react-native application loader's React Element is created
// as number and not Symbol, because it's not been defined by the polyfill yet.
// We import the application renderer, before Symbol is defined, in order to use
// number types as well. Otherwise this will result in the invariant exception,
// because fiber thingy will not recognise root react-native component as React
// Element, but as an Object.
//
// See node_modules/react-native/Libraries/polyfills/babelHelpers.js
// :babelHelpers.createRawReactElement - that's where first react-native element
// is created (super early - it's the app loader).
//
// See node_modules/react-native/Libraries/Renderer/ReactNativeFiber-dev.js
// and look for REACT_ELEMENT_TYPE definition - it's defined later when Symbol
// has been defined and type will not match.
//
// As an alternative solution we could stop using/polyfilling Symbols and
// replace with classpath string constants or some kind of a wrapper around
// that.

import 'react-native/Libraries/ReactNative/renderApplication';

// Android doesn't provide Symbol
import 'es6-symbol/implement';

import './react/index.native';

