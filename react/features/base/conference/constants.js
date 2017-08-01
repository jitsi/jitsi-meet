/**
 * The command type for updating a participant's avatar ID.
 *
 * @type {string}
 */
export const AVATAR_ID_COMMAND = 'avatar-id';

/**
 * The command type for updating a participant's avatar URL.
 *
 * @type {string}
 */
export const AVATAR_URL_COMMAND = 'avatar-url';

/**
 * The command type for updating a participant's e-mail address.
 *
 * @type {string}
 */
export const EMAIL_COMMAND = 'email';

/**
 * The name of the {@code JitsiConference} property which identifies the URL of
 * the conference represented by the {@code JitsiConference} instance.
 *
 * TODO It was introduced in a moment of desperation. Jitsi Meet SDK for Android
 * and iOS needs to deliver events from the JavaScript side where they originate
 * to the Java and Objective-C sides, respectively, where they are to be
 * handled. The URL of the {@code JitsiConference} was chosen as the identifier
 * because the Java and Objective-C sides join by URL through their respective
 * loadURL methods. But features/base/connection's {@code locationURL} is not
 * guaranteed at the time of this writing to match the {@code JitsiConference}
 * instance when the events are to be fired. Patching {@code JitsiConference}
 * from the outside is not cool but it should suffice for now.
 */
export const JITSI_CONFERENCE_URL_KEY = Symbol('url');
