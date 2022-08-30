import './native';

// Re-export JitsiMeetJS from the library lib-jitsi-meet to (the other features
// of) the project jitsi-meet.
//

import JitsiMeetJS from 'lib-jitsi-meet';
export { JitsiMeetJS as default };
