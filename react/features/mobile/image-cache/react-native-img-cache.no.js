// XXX The third-party react-native modules react-native-fetch-blob utilizes the
// same HTTP library as react-native i.e. okhttp. Unfortunately, that means that
// the versions of okhttp on which react-native and react-native-fetch-blob
// depend may have incompatible APIs. Such an incompatibility will be made
// apparent at compile time and the developer doing the compilation may choose
// to not compile react-native-fetch-blob's source code.

// XXX The choice between the use of react-native-img-cache could've been done
// at runtime based on whether NativeModules.RNFetchBlob is defined if only
// react-native-fetch-blob would've completely protected itself. At the time of
// this writing its source code appears to be attempting to protect itself from
// missing native binaries but that protection is incomplete and there's a
// TypeError.

import { Image } from 'react-native';
export { Image as CachedImage, undefined as ImageCache };
