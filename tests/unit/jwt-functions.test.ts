import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
    getJwtExpirationDate,
    getJwtName,
    isJwtFeatureEnabled,
    isJwtFeatureEnabledStateless,
    stripJwtSignatures,
    validateJwt
} from '../../react/features/base/jwt/functions';
import { JWT_VALIDATION_ERRORS } from '../../react/features/base/jwt/constants';

/**
 * Helper to construct a base64url-encoded mock JWT string.
 */
function createMockJwt(header: any, payload: any, signature = 'mockSignature') {
    const b64 = (obj: any) => {
        if (obj === null) {
            return Buffer.from('null').toString('base64url');
        }

        return Buffer.from(JSON.stringify(obj)).toString('base64url');
    };

    return `${b64(header)}.${b64(payload)}.${signature}`;
}

describe('JWT Functions Unit Tests', () => {
    describe('stripJwtSignatures', () => {
        it('strips signature from a standard JWT string', () => {
            const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature123';
            const stripped = stripJwtSignatures(token);

            assert.strictEqual(stripped, 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0');
        });

        it('strips signature from a URL with jwt query parameter', () => {
            const url = 'https://meet.jit.si/room?jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.secretSignature#toolbar';
            const stripped = stripJwtSignatures(url);

            assert.strictEqual(
                stripped,
                'https://meet.jit.si/room?jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0#toolbar'
            );
        });

        it('supports URL objects', () => {
            const urlObj = new URL('https://meet.jit.si/room?jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.secretSignature');
            const stripped = stripJwtSignatures(urlObj);

            assert.strictEqual(
                stripped,
                'https://meet.jit.si/room?jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0'
            );
        });

        it('leaves non-JWT strings untouched', () => {
            const regularUrl = 'https://meet.jit.si/my-regular-meeting#config.startWithAudioMuted=true';
            assert.strictEqual(stripJwtSignatures(regularUrl), regularUrl);
        });

        it('handles undefined input safely', () => {
            assert.strictEqual(stripJwtSignatures(undefined), 'undefined');
        });
    });

    describe('getJwtExpirationDate', () => {
        it('returns undefined when jwt is undefined or empty', () => {
            assert.strictEqual(getJwtExpirationDate(undefined), undefined);
            assert.strictEqual(getJwtExpirationDate(''), undefined);
        });

        it('extracts expiration timestamp and converts to Date object', () => {
            const expSeconds = 1750000000;
            const token = createMockJwt({ alg: 'HS256' }, { exp: expSeconds });
            const expDate = getJwtExpirationDate(token);

            assert.ok(expDate instanceof Date, 'Should return a Date object');
            assert.strictEqual(expDate.getTime(), expSeconds * 1000);
        });
    });

    describe('isJwtFeatureEnabledStateless', () => {
        it('returns default fallback when feature is undefined in features object', () => {
            const resTrue = isJwtFeatureEnabledStateless({
                localParticipantFeatures: {},
                feature: 'recording',
                ifNotInFeatures: true
            });
            assert.strictEqual(resTrue, true);

            const resFalse = isJwtFeatureEnabledStateless({
                localParticipantFeatures: undefined,
                feature: 'recording',
                ifNotInFeatures: false
            });
            assert.strictEqual(resFalse, false);
        });

        it('evaluates boolean true and string "true" as true', () => {
            const booleanRes = isJwtFeatureEnabledStateless({
                localParticipantFeatures: { recording: true },
                feature: 'recording',
                ifNotInFeatures: false
            });
            assert.strictEqual(booleanRes, true);

            const stringRes = isJwtFeatureEnabledStateless({
                localParticipantFeatures: { recording: 'true' as any },
                feature: 'recording',
                ifNotInFeatures: false
            });
            assert.strictEqual(stringRes, true);
        });

        it('evaluates boolean false and string "false" as false', () => {
            const booleanRes = isJwtFeatureEnabledStateless({
                localParticipantFeatures: { recording: false },
                feature: 'recording',
                ifNotInFeatures: true
            });
            assert.strictEqual(booleanRes, false);

            const stringRes = isJwtFeatureEnabledStateless({
                localParticipantFeatures: { recording: 'false' as any },
                feature: 'recording',
                ifNotInFeatures: true
            });
            assert.strictEqual(stringRes, false);
        });
    });

    describe('isJwtFeatureEnabled', () => {
        it('checks feature from redux state participant features', () => {
            const state: any = {
                'features/base/participants': {
                    local: {
                        features: {
                            recording: true
                        }
                    }
                }
            };

            assert.strictEqual(isJwtFeatureEnabled(state, 'recording', false), true);
            assert.strictEqual(isJwtFeatureEnabled(state, 'livestreaming', false), false);
        });

        it('falls back to default when participant has no features', () => {
            const state: any = {
                'features/base/participants': {
                    local: {}
                }
            };

            assert.strictEqual(isJwtFeatureEnabled(state, 'recording', true), true);
            assert.strictEqual(isJwtFeatureEnabled(state, 'recording', false), false);
        });

        it('initializes empty features for vpaas meetings if features are missing', () => {
            const state: any = {
                'features/jaas': {
                    isVpaas: true
                },
                'features/base/participants': {
                    local: {}
                }
            };

            assert.strictEqual(isJwtFeatureEnabled(state, 'recording', false), false);
        });
    });

    describe('getJwtName', () => {
        it('retrieves user name from redux jwt state', () => {
            const state: any = {
                'features/base/jwt': {
                    user: { name: 'Alice Smith' }
                }
            };

            assert.strictEqual(getJwtName(state), 'Alice Smith');
        });

        it('returns undefined if user object or name is not present', () => {
            const stateWithoutUser: any = {
                'features/base/jwt': {}
            };
            assert.strictEqual(getJwtName(stateWithoutUser), undefined);

            const stateWithEmptyUser: any = {
                'features/base/jwt': { user: {} }
            };
            assert.strictEqual(getJwtName(stateWithEmptyUser), undefined);
        });
    });

    describe('validateJwt', () => {
        const now = Math.floor(Date.now() / 1000);

        it('validates a correct standard JWT without errors', () => {
            const token = createMockJwt(
                { alg: 'HS256', typ: 'JWT' },
                {
                    exp: now + 3600,
                    nbf: now - 60,
                    context: {
                        features: {
                            recording: true,
                            livestreaming: 'true'
                        }
                    }
                }
            );

            const errors = validateJwt(token);
            assert.deepStrictEqual(errors, []);
        });

        it('detects missing header or payload', () => {
            const noHeaderToken = createMockJwt(null, { exp: now + 3600 });
            assert.deepStrictEqual(validateJwt(noHeaderToken), [
                { key: JWT_VALIDATION_ERRORS.HEADER_NOT_FOUND }
            ]);

            const noPayloadToken = createMockJwt({ alg: 'HS256' }, null);
            assert.deepStrictEqual(validateJwt(noPayloadToken), [
                { key: JWT_VALIDATION_ERRORS.PAYLOAD_NOT_FOUND }
            ]);
        });

        it('detects missing kid for JaaS tokens', () => {
            const jaasTokenWithoutKid = createMockJwt(
                { alg: 'HS256' },
                {
                    sub: 'vpaas-magic-cookie-123',
                    exp: now + 3600
                }
            );

            const errors = validateJwt(jaasTokenWithoutKid);
            assert.deepStrictEqual(errors, [
                { key: JWT_VALIDATION_ERRORS.KID_NOT_FOUND }
            ]);
        });

        it('validates JaaS token properties (kid mismatch, aud, iss, features)', () => {
            const invalidJaasToken = createMockJwt(
                {
                    alg: 'HS256',
                    kid: 'wrong-cookie/my-key'
                },
                {
                    sub: 'vpaas-magic-cookie-123',
                    aud: 'wrong-aud',
                    iss: 'wrong-iss',
                    exp: now + 3600
                }
            );

            const errors = validateJwt(invalidJaasToken);
            const errorKeys = errors.map((e: any) => e.key);

            assert.ok(errorKeys.includes(JWT_VALIDATION_ERRORS.KID_MISMATCH));
            assert.ok(errorKeys.includes(JWT_VALIDATION_ERRORS.AUD_INVALID));
            assert.ok(errorKeys.includes(JWT_VALIDATION_ERRORS.ISS_INVALID));
            assert.ok(errorKeys.includes(JWT_VALIDATION_ERRORS.FEATURES_NOT_FOUND));
        });

        it('validates nbf in the future or invalid format', () => {
            const futureNbfToken = createMockJwt(
                { alg: 'HS256' },
                {
                    nbf: now + 7200,
                    exp: now + 10000,
                    context: {}
                }
            );
            const futureErrors = validateJwt(futureNbfToken);
            assert.ok(futureErrors.some((e: any) => e.key === JWT_VALIDATION_ERRORS.NBF_FUTURE));

            const invalidNbfToken = createMockJwt(
                { alg: 'HS256' },
                {
                    nbf: 'not-a-number' as any,
                    exp: now + 3600,
                    context: {}
                }
            );
            const invalidNbfErrors = validateJwt(invalidNbfToken);
            assert.ok(invalidNbfErrors.some((e: any) => e.key === JWT_VALIDATION_ERRORS.NBF_INVALID));
        });

        it('validates token expiration (expired token or invalid exp)', () => {
            const expiredToken = createMockJwt(
                { alg: 'HS256' },
                {
                    exp: now - 3600,
                    context: {}
                }
            );
            const expiredErrors = validateJwt(expiredToken);
            assert.ok(expiredErrors.some((e: any) => e.key === JWT_VALIDATION_ERRORS.TOKEN_EXPIRED));

            const invalidExpToken = createMockJwt(
                { alg: 'HS256' },
                {
                    exp: 'invalid-exp' as any,
                    context: {}
                }
            );
            const invalidExpErrors = validateJwt(invalidExpToken);
            assert.ok(invalidExpErrors.some((e: any) => e.key === JWT_VALIDATION_ERRORS.EXP_INVALID));
        });

        it('validates context features against MEET_FEATURES and value types', () => {
            const tokenWithInvalidFeatures = createMockJwt(
                { alg: 'HS256' },
                {
                    exp: now + 3600,
                    context: {
                        features: {
                            'unknown-custom-feature': true,
                            recording: 12345 as any
                        }
                    }
                }
            );

            const errors = validateJwt(tokenWithInvalidFeatures);
            const featureInvalidError = errors.find((e: any) => e.key === JWT_VALIDATION_ERRORS.FEATURE_INVALID);
            assert.ok(featureInvalidError, 'Should report unknown feature name');
            assert.strictEqual((featureInvalidError as any).args.feature, 'unknown-custom-feature');

            const featureValueInvalidError = errors.find((e: any) => e.key === JWT_VALIDATION_ERRORS.FEATURE_VALUE_INVALID);
            assert.ok(featureValueInvalidError, 'Should report invalid feature value');
            assert.strictEqual((featureValueInvalidError as any).args.feature, 'recording');
        });

        it('reports CONTEXT_NOT_FOUND when context is missing', () => {
            const noContextToken = createMockJwt(
                { alg: 'HS256' },
                {
                    exp: now + 3600
                }
            );

            const errors = validateJwt(noContextToken);
            assert.ok(errors.some((e: any) => e.key === JWT_VALIDATION_ERRORS.CONTEXT_NOT_FOUND));
        });
    });
});
