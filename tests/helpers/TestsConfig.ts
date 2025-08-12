/**
 * Global configuration that the tests are run with. Loaded from environment variables.
 */
export const config = {
    /** Enable debug logging. Note this includes private information from .env */
    debug: Boolean(process.env.JITSI_DEBUG?.trim()),
    iframe: {
        customerId: process.env.IFRAME_TENANT?.trim()?.replace('vpaas-magic-cookie-', ''),
        tenant: process.env.IFRAME_TENANT?.trim(),
        /** Whether the configuration specifies a JaaS account for the iFrame API tests. */
        usesJaas: Boolean(process.env.JWT_PRIVATE_KEY_PATH && process.env.JWT_KID?.startsWith('vpaas-magic-cookie-')),
    },
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
    jwt: {
        kid: process.env.JWT_KID?.trim(),
        /** A pre-configured token used by some tests. */
        preconfiguredToken: process.env.JWT_ACCESS_TOKEN?.trim(),
        privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH?.trim()
    },
    roomName: {
        /** Optional prefix for room names used for tests. */
        prefix: process.env.ROOM_NAME_PREFIX?.trim(),
        /** Optional suffix for room names used for tests. */
        suffix: process.env.ROOM_NAME_SUFFIX?.trim()
    },
    webhooksProxy: {
        enabled: Boolean(process.env.WEBHOOKS_PROXY_URL && process.env.WEBHOOKS_PROXY_SHARED_SECRET),
        sharedSecret: process.env.WEBHOOKS_PROXY_SHARED_SECRET?.trim(),
        url: process.env.WEBHOOKS_PROXY_URL?.trim(),
    }
};

if (config.debug) {
    console.log('TestsConfig:', JSON.stringify(config, null, 2));
}
