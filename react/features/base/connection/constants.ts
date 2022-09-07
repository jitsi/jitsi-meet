/**
 * The name of the {@code JitsiConnection} property which identifies the {@code JitsiConference} currently associated
 * with it.
 *
 * FIXME: This is a hack. It was introduced to solve the following case: if a user presses hangup quickly, they may
 * "leave the conference" before the actual conference was ever created. While we might have a connection in place,
 * there is no conference which can be left, thus no CONFERENCE_LEFT action will ever be fired.
 *
 * This is problematic because the external API module used to send events to the native SDK won't know what to send.
 * So, in order to detect this situation we are attaching the conference object to the connection which runs it.
 */
export const JITSI_CONNECTION_CONFERENCE_KEY = Symbol('conference');

/**
 * The name of the {@code JitsiConnection} property which identifies the location URL where the connection will be made.
 */
export const JITSI_CONNECTION_URL_KEY = Symbol('url');
