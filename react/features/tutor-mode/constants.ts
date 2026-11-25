/**
 * The room-metadata key that carries the tutor-mode state. A moderator writes
 * {@code { enabled }} and the server replaces it with the sanitized, authoritative
 * value (tutor identity and timestamp included).
 */
export const TUTOR_MODE_METADATA_KEY = 'tutorMode';

/**
 * The room-metadata key through which the server advertises that tutor-mode
 * enforcement is actually available. It is written only by the server and is
 * blocked from client writes, so its presence is the client's proof that the
 * media/privacy restrictions are enforced server-side rather than simulated in
 * the UI.
 */
export const TUTOR_MODE_CAPABILITIES_METADATA_KEY = 'tutorModeCapabilities';

/**
 * How long to wait for the server to confirm a tutor-mode change before the
 * request is considered failed. The metadata round-trip is normally fast.
 */
export const TUTOR_MODE_REQUEST_TIMEOUT = 10000;
