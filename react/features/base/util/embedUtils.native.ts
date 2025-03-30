import { getBundleId } from 'react-native-device-info';

/**
 * BUndle ids for the Jitsi Meet apps.
 */
const JITSI_MEET_APPS = [

    // iOS app.
    'com.atlassian.JitsiMeet.ios',

    // Android + iOS (testing) app.
    'org.jitsi.meet',

    // Android debug app.
    'org.jitsi.meet.debug',

    // 8x8 Work (Android).
    'org.vom8x8.sipua',

    // 8x8 Work (iOS).
    'com.yourcompany.Virtual-Office'
];

/**
 * Checks whether we are loaded in iframe. In the mobile case we treat SDK
 * consumers as the web treats iframes.
 *
 * @returns {boolean} Whether the current app is a Jitsi Meet app.
 */
export function isEmbedded(): boolean {
    return !JITSI_MEET_APPS.includes(getBundleId());
}
