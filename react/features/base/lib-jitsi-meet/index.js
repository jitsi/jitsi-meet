// Re-export JitsiMeetJS from the library lib-jitsi-meet to (the other features
// of) the project jitsi-meet-react.
import JitsiMeetJS from './_';
export { JitsiMeetJS as default };

export * from './actions';
export * from './actionTypes';
export * from './functions';
