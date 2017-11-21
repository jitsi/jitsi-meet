// Re-export JitsiMeetJS from the library lib-jitsi-meet to (the other features
// of) the project jitsi-meet.
import JitsiMeetJS from './_';
export { JitsiMeetJS as default };

// XXX Re-export the types exported by JitsiMeetJS in order to prevent undefined
// imported JitsiMeetJS. It may be caused by import cycles but I have not
// confirmed the theory.
export const JitsiConferenceErrors = JitsiMeetJS.errors.conference;
export const JitsiConferenceEvents = JitsiMeetJS.events.conference;
export const JitsiConnectionErrors = JitsiMeetJS.errors.connection;
export const JitsiConnectionEvents = JitsiMeetJS.events.connection;
export const JitsiConnectionQualityEvents
    = JitsiMeetJS.events.connectionQuality;
export const JitsiMediaDevicesEvents = JitsiMeetJS.events.mediaDevices;
export const JitsiParticipantConnectionStatus
    = JitsiMeetJS.constants.participantConnectionStatus;
export const JitsiRecordingStatus = JitsiMeetJS.constants.recordingStatus;
export const JitsiSIPVideoGWStatus = JitsiMeetJS.constants.sipVideoGW;
export const JitsiTrackErrors = JitsiMeetJS.errors.track;
export const JitsiTrackEvents = JitsiMeetJS.events.track;

export const analytics = JitsiMeetJS.analytics;

export * from './actions';
export * from './actionTypes';
export * from './constants';
export * from './functions';

import './middleware';
import './reducer';
