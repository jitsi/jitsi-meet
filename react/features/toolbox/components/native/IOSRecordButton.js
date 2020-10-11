/* global APP */

import { requireNativeComponent, NativeModules, NativeEventEmitter } from 'react-native';
const RecordNativeComponent = requireNativeComponent('RecordComponent');


var ScreenShareController = NativeModules.ScreenShareController;
console.log("registering callback")
const screenShareControllerEmitter = new NativeEventEmitter(ScreenShareController);

const subscription = screenShareControllerEmitter.addListener(
  'ScreenRecState',
  (reminder) => {
      console.log(`successfully sent event from native to react native globally ${reminder.name}`);
      if (reminder.name == 'recStarted') {
        global.window.storeDispatch({ type: 'START_SCREEN_SHARING' });
      } else if (reminder.name == 'recStopped') {
        global.window.storeDispatch({ type: 'END_SCREEN_SHARING' });
      } else {
          console.log('unrecognized event');
      }
    }
);

export {
    ScreenShareController
}
export default RecordNativeComponent;

// ScreenShareController.registerCallback((name, sirname) => {
//     console.log(`global callback works ${name} ${sirname}`);
// });
