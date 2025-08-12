/**
 * Global configuration that the tests are run with. Loaded from environment variables.
 */
export const config = {
    /** Whether the configuration specifies a JaaS account for the iFrame API tests. */
    iFrameUsesJaas: Boolean(process.env.JWT_PRIVATE_KEY_PATH && process.env.JWT_KID?.startsWith('vpaas-magic-cookie-')),
    jaas: {
        /** Whether the configuration for JaaS specific tests is enabled. */
        enabled: Boolean(process.env.JAAS_TENANT && process.env.JAAS_PRIVATE_KEY_PATH && process.env.JAAS_KID),
        /** The JaaS key ID, used to sign the tokens. */
        kid: process.env.JAAS_KID?.trim(),
        /** The path to the JaaS private key, used to sign JaaS tokens. */
        privateKeyPath: process.env.JAAS_PRIVATE_KEY_PATH?.trim(),
        /** The JaaS tenant (vpaas-magic-cookie-<ID>) . */
        tenant: process.env.JAAS_TENANT?.trim(),
    },
    roomName: {
        /** Optional prefix for room names used for tests. */
        prefix: process.env.ROOM_NAME_PREFIX?.trim(),
        /** Optional suffix for room names used for tests. */
        suffix: process.env.ROOM_NAME_SUFFIX?.trim()
    }
};
