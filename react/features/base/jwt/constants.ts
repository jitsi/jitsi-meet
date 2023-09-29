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

/**
 * The JWT validation errors for JaaS.
 */
export const JWT_VALIDATION_ERRORS = {
    AUD_INVALID: 'audInvalid',
    CONTEXT_NOT_FOUND: 'contextNotFound',
    EXP_INVALID: 'expInvalid',
    FEATURE_INVALID: 'featureInvalid',
    FEATURE_VALUE_INVALID: 'featureValueInvalid',
    FEATURES_NOT_FOUND: 'featuresNotFound',
    HEADER_NOT_FOUND: 'headerNotFound',
    ISS_INVALID: 'issInvalid',
    KID_NOT_FOUND: 'kidNotFound',
    KID_MISMATCH: 'kidMismatch',
    NBF_FUTURE: 'nbfFuture',
    NBF_INVALID: 'nbfInvalid',
    PAYLOAD_NOT_FOUND: 'payloadNotFound',
    TOKEN_EXPIRED: 'tokenExpired'
};
