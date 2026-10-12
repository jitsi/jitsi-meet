// Re-export JitsiMeetJS from the library lib-jitsi-meet to (the other features
// of) the project jitsi-meet.
//

// @ts-ignore
import JitsiMeetJS from 'lib-jitsi-meet';

import { registerNativeE2EERuntime } from './native-e2ee/register.native';

registerNativeE2EERuntime(JitsiMeetJS);

export { JitsiMeetJS as default };
