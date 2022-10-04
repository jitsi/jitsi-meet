/**
 * The list of supported meeting features to enable/disable through jwt.
 */
export const MEET_FEATURES = {
    BRANDING: 'branding',
    CALENDAR: 'calendar',
    CALLSTATS: 'callstats',
    FLIP: 'flip',
    INBOUND_CALL: 'inbound-call',
    LIVESTREAMING: 'livestreaming',
    LOBBY: 'lobby',
    MODERATION: 'moderation',
    OUTBOUND_CALL: 'outbound-call',
    RECORDING: 'recording',
    ROOM: 'room',
    SCREEN_SHARING: 'screen-sharing',
    SIP_INBOUND_CALL: 'sip-inbound-call',
    SIP_OUTBOUND_CALL: 'sip-outbound-call',
    TRANSCRIPTION: 'transcription'
};

/**
 * A mapping between jwt features and toolbar buttons keys.
 */
export const FEATURES_TO_BUTTONS_MAPPING = {
    'livestreaming': 'livestreaming',
    'recording': 'recording',
    'transcription': 'closedcaptions'
};
