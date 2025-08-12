/**
 * Global configuration that the tests are run with. Loaded from environment variables.
 */
export const config = {
    /** Whether the configuration specifies a JaaS account for the iFrame API tests. */
    iFrameUsesJaas: Boolean(process.env.JWT_PRIVATE_KEY_PATH && process.env.JWT_KID?.startsWith('vpaas-magic-cookie-')),
    roomName: {
        /** Optional prefix for room names used for tests. */
        prefix: process.env.ROOM_NAME_PREFIX?.trim(),
        /** Optional suffix for room names used for tests. */
        suffix: process.env.ROOM_NAME_SUFFIX?.trim()
    }
};
