import '../../__tests__/setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SdkManager } from '../sdk-manager.service';
import { ConfigService } from '../config.service';
import { Auth, Drive } from '@internxt/sdk';

vi.mock('@internxt/sdk', () => ({
    Auth: {
        client: vi.fn().mockImplementation((baseUrl, appDetails, security) => ({
            baseUrl,
            appDetails,
            security,
            unauthorizedCallback: vi.fn()
        }))
    },
    Drive: {
        Users: {
            client: vi.fn().mockImplementation((baseUrl, appDetails, security) => ({
                baseUrl,
                appDetails,
                security,
                unauthorizedCallback: vi.fn()
            }))
        }
    }
}));

describe('SdkManager', () => {
    beforeEach(() => {
        SdkManager.clean();
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('When initializing with api security, then the security details are stored', () => {
            const mockApiSecurity = {
                token: 'test-token',
                newToken: 'new-test-token',
                userId: 'test-user-id'
            };

            SdkManager.init(mockApiSecurity);
            const storedSecurity = SdkManager.getApiSecurity({ throwErrorOnMissingCredentials: false });
            expect(storedSecurity).toEqual(mockApiSecurity);
        });

        it('When cleaning the manager, then the security details are removed', () => {
            const mockApiSecurity = {
                token: 'test-token',
                newToken: 'new-test-token',
                userId: 'test-user-id'
            };

            SdkManager.init(mockApiSecurity);
            SdkManager.clean();
            const storedSecurity = SdkManager.getApiSecurity({ throwErrorOnMissingCredentials: false });
            expect(storedSecurity).toBeUndefined();
        });

        it('When getting api security without credentials and throwErrorOnMissingCredentials is true, then an error is thrown', () => {
            expect(() => SdkManager.getApiSecurity()).toThrow('Api security properties not found in SdkManager');
        });

        it('When getting api security without credentials and throwErrorOnMissingCredentials is false, then undefined is returned', () => {
            const result = SdkManager.getApiSecurity({ throwErrorOnMissingCredentials: false });
            expect(result).toBeUndefined();
        });
    });

    describe('App details', () => {
        it('When getting app details, then the correct package.json details are returned', () => {
            const appDetails = SdkManager.getAppDetails();
            expect(appDetails).toEqual({
                clientName: 'internxt-meet',
                clientVersion: expect.any(String)
            });
        });
    });

    describe('SDK clients', () => {
        const mockApiSecurity = {
            token: 'test-token',
            newToken: 'new-test-token',
            userId: 'test-user-id'
        };

        beforeEach(() => {
            vi.spyOn(ConfigService.instance, 'get').mockImplementation((key: string) => {
                const config = {
                    'DRIVE_API_URL': 'https://test-drive-api.com',
                    'DRIVE_NEW_API_URL': 'https://test-drive-new-api.com'
                };
                return config[key];
            });
        });

        it('When getting auth client, then the correct client is returned with proper configuration', () => {
            SdkManager.init(mockApiSecurity);
            const authClient = SdkManager.instance.getAuth();
            expect(authClient).toBeDefined();
            expect(Auth.client).toHaveBeenCalledWith(
                'https://test-drive-api.com',
                expect.any(Object),
                mockApiSecurity
            );
        });

        it('When getting new auth client, then the correct client is returned with proper configuration', () => {
            SdkManager.init(mockApiSecurity);
            const newAuthClient = SdkManager.instance.getNewAuth();
            expect(newAuthClient).toBeDefined();
            expect(Auth.client).toHaveBeenCalledWith(
                'https://test-drive-new-api.com',
                expect.any(Object),
                mockApiSecurity
            );
        });

        it('When getting users client, then the correct client is returned with proper configuration', () => {
            SdkManager.init(mockApiSecurity);
            const usersClient = SdkManager.instance.getUsers();
            expect(usersClient).toBeDefined();
            expect(Drive.Users.client).toHaveBeenCalledWith(
                'https://test-drive-api.com',
                expect.any(Object),
                mockApiSecurity
            );
        });

        it('When getting clients without api security, then they are created with undefined security', () => {
            SdkManager.instance.getAuth();
           SdkManager.instance.getNewAuth();
            SdkManager.instance.getUsers();

            expect(Auth.client).toHaveBeenCalledWith(
                'https://test-drive-api.com',
                expect.any(Object),
                undefined
            );
            expect(Auth.client).toHaveBeenCalledWith(
                'https://test-drive-new-api.com',
                expect.any(Object),
                undefined
            );
            expect(Drive.Users.client).toHaveBeenCalledWith(
                'https://test-drive-api.com',
                expect.any(Object),
                undefined
            );
        });
    });
});