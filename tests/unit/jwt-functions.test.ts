import { describe, expect, it } from 'vitest';

import { JWT_VALIDATION_ERRORS } from '../../react/features/base/jwt/constants';
import {
    getJwtExpirationDate,
    getJwtName,
    isJwtFeatureEnabled,
    isJwtFeatureEnabledStateless,
    stripJwtSignatures,
    validateJwt
} from '../../react/features/base/jwt/functions';

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

            expect(stripped).toBe('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0');
        });

        it('strips signature from a URL with jwt query parameter', () => {
            const url = 'https://meet.jit.si/room?jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.secretSignature#toolbar';
            const stripped = stripJwtSignatures(url);

            expect(stripped).toBe(
                'https://meet.jit.si/room?jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0#toolbar'
            );
        });

        it('supports URL objects', () => {
            const urlObj = new URL('https://meet.jit.si/room?jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.secretSignature');
            const stripped = stripJwtSignatures(urlObj);

            expect(stripped).toBe(
                'https://meet.jit.si/room?jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0'
            );
        });

        it('leaves non-JWT strings untouched', () => {
            const regularUrl = 'https://meet.jit.si/my-regular-meeting#config.startWithAudioMuted=true';

            expect(stripJwtSignatures(regularUrl)).toBe(regularUrl);
        });

        it('handles undefined input safely', () => {
            expect(stripJwtSignatures(undefined)).toBe('undefined');
        });
    });

    describe('getJwtExpirationDate', () => {
        it('returns undefined when jwt is undefined or empty', () => {
            expect(getJwtExpirationDate(undefined)).toBeUndefined();
            expect(getJwtExpirationDate('')).toBeUndefined();
        });

        it('extracts expiration timestamp and converts to Date object', () => {
            const expSeconds = 1750000000;
            const token = createMockJwt({ alg: 'HS256' }, { exp: expSeconds });
            const expDate = getJwtExpirationDate(token);

            expect(expDate).toBeInstanceOf(Date);
            expect(expDate?.getTime()).toBe(expSeconds * 1000);
        });
    });

    describe('isJwtFeatureEnabledStateless', () => {
        it('returns default fallback when feature is undefined in features object', () => {
            const resTrue = isJwtFeatureEnabledStateless({
                feature: 'recording',
                ifNotInFeatures: true,
                localParticipantFeatures: {}
            });

            expect(resTrue).toBe(true);

            const resFalse = isJwtFeatureEnabledStateless({
                feature: 'recording',
                ifNotInFeatures: false,
                localParticipantFeatures: undefined
            });

            expect(resFalse).toBe(false);
        });

        it('evaluates boolean true and string "true" as true', () => {
            const booleanRes = isJwtFeatureEnabledStateless({
                feature: 'recording',
                ifNotInFeatures: false,
                localParticipantFeatures: { recording: true }
            });

            expect(booleanRes).toBe(true);

            const stringRes = isJwtFeatureEnabledStateless({
                feature: 'recording',
                ifNotInFeatures: false,
                localParticipantFeatures: { recording: 'true' as any }
            });

            expect(stringRes).toBe(true);
        });

        it('evaluates boolean false and string "false" as false', () => {
            const booleanRes = isJwtFeatureEnabledStateless({
                feature: 'recording',
                ifNotInFeatures: true,
                localParticipantFeatures: { recording: false }
            });

            expect(booleanRes).toBe(false);

            const stringRes = isJwtFeatureEnabledStateless({
                feature: 'recording',
                ifNotInFeatures: true,
                localParticipantFeatures: { recording: 'false' as any }
            });

            expect(stringRes).toBe(false);
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

            expect(isJwtFeatureEnabled(state, 'recording', false)).toBe(true);
            expect(isJwtFeatureEnabled(state, 'livestreaming', false)).toBe(false);
        });

        it('falls back to default when participant has no features', () => {
            const state: any = {
                'features/base/participants': {
                    local: {}
                }
            };

            expect(isJwtFeatureEnabled(state, 'recording', true)).toBe(true);
            expect(isJwtFeatureEnabled(state, 'recording', false)).toBe(false);
        });

        it('initializes empty features for vpaas meetings if features are missing', () => {
            const state: any = {
                'features/base/connection': {
                    locationURL: {
                        pathname: '/vpaas-magic-cookie-123/my-room'
                    }
                },
                'features/base/participants': {
                    local: {}
                }
            };

            expect(isJwtFeatureEnabled(state, 'recording', false)).toBe(false);
        });
    });

    describe('getJwtName', () => {
        it('retrieves user name from redux jwt state', () => {
            const state: any = {
                'features/base/jwt': {
                    user: { name: 'Alice Smith' }
                }
            };

            expect(getJwtName(state)).toBe('Alice Smith');
        });

        it('returns undefined if user object or name is not present', () => {
            const stateWithoutUser: any = {
                'features/base/jwt': {}
            };

            expect(getJwtName(stateWithoutUser)).toBeUndefined();

            const stateWithEmptyUser: any = {
                'features/base/jwt': { user: {} }
            };

            expect(getJwtName(stateWithEmptyUser)).toBeUndefined();
        });
    });

    describe('validateJwt', () => {
        const now = Math.floor(Date.now() / 1000);

        it('validates a correct standard JWT without errors', () => {
            const token = createMockJwt(
                { alg: 'HS256', typ: 'JWT' },
                {
                    context: {
                        features: {
                            livestreaming: 'true',
                            recording: true
                        }
                    },
                    exp: now + 3600,
                    nbf: now - 60
                }
            );

            const errors = validateJwt(token);

            expect(errors).toEqual([]);
        });

        it('detects missing header or payload', () => {
            const noHeaderToken = createMockJwt(null, { exp: now + 3600 });

            expect(validateJwt(noHeaderToken)).toEqual([
                { key: JWT_VALIDATION_ERRORS.HEADER_NOT_FOUND }
            ]);

            const noPayloadToken = createMockJwt({ alg: 'HS256' }, null);

            expect(validateJwt(noPayloadToken)).toEqual([
                { key: JWT_VALIDATION_ERRORS.PAYLOAD_NOT_FOUND }
            ]);
        });

        it('detects missing kid for JaaS tokens', () => {
            const jaasTokenWithoutKid = createMockJwt(
                { alg: 'HS256' },
                {
                    exp: now + 3600,
                    sub: 'vpaas-magic-cookie-123'
                }
            );

            const errors = validateJwt(jaasTokenWithoutKid);

            expect(errors).toEqual([
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
                    aud: 'wrong-aud',
                    exp: now + 3600,
                    iss: 'wrong-iss',
                    sub: 'vpaas-magic-cookie-123'
                }
            );

            const errors = validateJwt(invalidJaasToken);
            const errorKeys = errors.map((e: any) => e.key);

            expect(errorKeys).toContain(JWT_VALIDATION_ERRORS.KID_MISMATCH);
            expect(errorKeys).toContain(JWT_VALIDATION_ERRORS.AUD_INVALID);
            expect(errorKeys).toContain(JWT_VALIDATION_ERRORS.ISS_INVALID);
            expect(errorKeys).toContain(JWT_VALIDATION_ERRORS.FEATURES_NOT_FOUND);
        });

        it('validates nbf in the future or invalid format', () => {
            const futureNbfToken = createMockJwt(
                { alg: 'HS256' },
                {
                    context: {},
                    exp: now + 10000,
                    nbf: now + 7200
                }
            );
            const futureErrors = validateJwt(futureNbfToken);

            expect(futureErrors.some((e: any) => e.key === JWT_VALIDATION_ERRORS.NBF_FUTURE)).toBe(true);

            const invalidNbfToken = createMockJwt(
                { alg: 'HS256' },
                {
                    context: {},
                    exp: now + 3600,
                    nbf: 'not-a-number' as any
                }
            );
            const invalidNbfErrors = validateJwt(invalidNbfToken);

            expect(invalidNbfErrors.some((e: any) => e.key === JWT_VALIDATION_ERRORS.NBF_INVALID)).toBe(true);
        });

        it('validates token expiration (expired token or invalid exp)', () => {
            const expiredToken = createMockJwt(
                { alg: 'HS256' },
                {
                    context: {},
                    exp: now - 3600
                }
            );
            const expiredErrors = validateJwt(expiredToken);

            expect(expiredErrors.some((e: any) => e.key === JWT_VALIDATION_ERRORS.TOKEN_EXPIRED)).toBe(true);

            const invalidExpToken = createMockJwt(
                { alg: 'HS256' },
                {
                    context: {},
                    exp: 'invalid-exp' as any
                }
            );
            const invalidExpErrors = validateJwt(invalidExpToken);

            expect(invalidExpErrors.some((e: any) => e.key === JWT_VALIDATION_ERRORS.EXP_INVALID)).toBe(true);
        });

        it('validates context features against MEET_FEATURES and value types', () => {
            const tokenWithInvalidFeatures = createMockJwt(
                { alg: 'HS256' },
                {
                    context: {
                        features: {
                            recording: 12345 as any,
                            'unknown-custom-feature': true
                        }
                    },
                    exp: now + 3600
                }
            );

            const errors = validateJwt(tokenWithInvalidFeatures);
            const featureInvalidError = errors.find((e: any) => e.key === JWT_VALIDATION_ERRORS.FEATURE_INVALID);

            expect(featureInvalidError).toBeDefined();
            expect((featureInvalidError as any).args.feature).toBe('unknown-custom-feature');

            const featureValueInvalidError = errors.find((e: any) => e.key === JWT_VALIDATION_ERRORS.FEATURE_VALUE_INVALID);

            expect(featureValueInvalidError).toBeDefined();
            expect((featureValueInvalidError as any).args.feature).toBe('recording');
        });

        it('reports CONTEXT_NOT_FOUND when context is missing', () => {
            const noContextToken = createMockJwt(
                { alg: 'HS256' },
                {
                    exp: now + 3600
                }
            );

            const errors = validateJwt(noContextToken);

            expect(errors.some((e: any) => e.key === JWT_VALIDATION_ERRORS.CONTEXT_NOT_FOUND)).toBe(true);
        });
    });
});
