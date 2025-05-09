import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReducerRegistry from "../../../../../redux/ReducerRegistry";
import { CLEAR_USER, SET_USER, UPDATE_USER, UserActionTypes } from "../actionTypes";
import { USER_REDUCER, userReducer } from "../reducer";
import { UserReducerState } from "../types";

vi.mock("../../../../../redux/ReducerRegistry", () => ({
    default: {
        register: vi.fn(),
    },
}));

describe("User Reducer", () => {
    const initialState: UserReducerState = {
        user: null,
        lastUpdated: null,
    };

    let dateSpy;
    const mockTimestamp = 1620000000000;

    beforeEach(() => {
        dateSpy = vi.spyOn(Date, "now").mockImplementation(() => mockTimestamp);
    });

    afterEach(() => {
        dateSpy.mockRestore();
    });

    describe("Registration", () => {
        it("When module is loaded, then it should register with ReducerRegistry", () => {
            expect(ReducerRegistry.register).toHaveBeenCalledWith(USER_REDUCER, userReducer);
        });
    });

    describe("SET_USER", () => {
        it("When SET_USER action is dispatched, then it should update state correctly", () => {
            const mockUser = {
                userId: "user-123",
                uuid: "user-uuid-123",
                email: "test@example.com",
                name: "John",
                lastname: "Doe",
                username: "johndoe",
                bridgeUser: "bridge-user-123",
                bucket: "bucket-123",
                backupsBucket: "backups-bucket-123",
                root_folder_id: 123,
                rootFolderId: "folder-123",
                rootFolderUuid: "uuid-123",
                sharedWorkspace: false,
                credit: 0,
                mnemonic: "test-mnemonic",
                privateKey: "private-key",
                publicKey: "public-key",
                revocationKey: "revocation-key",
                keys: {
                    ecc: {
                        publicKey: "ecc-public-key",
                        privateKey: "ecc-private-key",
                    },
                    kyber: {
                        publicKey: "kyber-public-key",
                        privateKey: "kyber-private-key",
                    },
                },
                teams: false,
                appSumoDetails: null,
                registerCompleted: true,
                hasReferralsProgram: false,
                createdAt: new Date("2023-01-01"),
                avatar: null,
                emailVerified: true,
            };

            const action = {
                type: SET_USER,
                payload: mockUser,
            } as UserActionTypes;

            const result = userReducer(initialState, action);

            expect(result).toEqual({
                user: mockUser,
                lastUpdated: mockTimestamp,
            });
        });

        it("When SET_USER action is dispatched with null, then it should set user to null", () => {
            const previousState = {
                user: {
                    userId: "user-123",
                    email: "test@example.com",
                },
                lastUpdated: 1610000000000,
            };

            const action = {
                type: SET_USER,
                payload: null,
            } as UserActionTypes;

            const result = userReducer(previousState as UserReducerState, action);

            expect(result).toEqual({
                user: null,
                lastUpdated: mockTimestamp,
            });
        });
    });

    describe("UPDATE_USER", () => {
        it("When UPDATE_USER action is dispatched, then it should update user properties", () => {
            const previousState = {
                user: {
                    userId: "user-123",
                    uuid: "user-uuid-123",
                    email: "old@example.com",
                    name: "Old",
                    lastname: "User",
                    username: "olduser",
                    bridgeUser: "bridge-user-123",
                    bucket: "bucket-123",
                    backupsBucket: "backups-bucket-123",
                    root_folder_id: 123,
                    rootFolderId: "folder-123",
                    rootFolderUuid: "uuid-123",
                    sharedWorkspace: false,
                    credit: 0,
                    mnemonic: "test-mnemonic",
                    privateKey: "private-key",
                    publicKey: "public-key",
                    revocationKey: "revocation-key",
                    keys: {
                        ecc: {
                            publicKey: "ecc-public-key",
                            privateKey: "ecc-private-key",
                        },
                        kyber: {
                            publicKey: "kyber-public-key",
                            privateKey: "kyber-private-key",
                        },
                    },
                    teams: false,
                    appSumoDetails: null,
                    registerCompleted: true,
                    hasReferralsProgram: false,
                    createdAt: new Date("2023-01-01"),
                    avatar: null,
                    emailVerified: true,
                },
                lastUpdated: 1610000000000,
            };

            const partialUserData = {
                email: "new@example.com",
                name: "New",
            };

            const action = {
                type: UPDATE_USER,
                payload: partialUserData,
            } as UserActionTypes;

            const result = userReducer(previousState as UserReducerState, action);

            expect(result).toEqual({
                user: {
                    userId: "user-123",
                    uuid: "user-uuid-123",
                    email: "new@example.com",
                    name: "New",
                    lastname: "User",
                    username: "olduser",
                    bridgeUser: "bridge-user-123",
                    bucket: "bucket-123",
                    backupsBucket: "backups-bucket-123",
                    root_folder_id: 123,
                    rootFolderId: "folder-123",
                    rootFolderUuid: "uuid-123",
                    sharedWorkspace: false,
                    credit: 0,
                    mnemonic: "test-mnemonic",
                    privateKey: "private-key",
                    publicKey: "public-key",
                    revocationKey: "revocation-key",
                    keys: {
                        ecc: {
                            publicKey: "ecc-public-key",
                            privateKey: "ecc-private-key",
                        },
                        kyber: {
                            publicKey: "kyber-public-key",
                            privateKey: "kyber-private-key",
                        },
                    },
                    teams: false,
                    appSumoDetails: null,
                    registerCompleted: true,
                    hasReferralsProgram: false,
                    createdAt: new Date("2023-01-01"),
                    avatar: null,
                    emailVerified: true,
                },
                lastUpdated: mockTimestamp,
            });
        });

        it("When UPDATE_USER action is dispatched but user in store is null, then it should return original state", () => {
            const action = {
                type: UPDATE_USER,
                payload: {
                    name: "New Name",
                },
            } as UserActionTypes;

            const result = userReducer(initialState, action);

            expect(result).toBe(initialState);
        });
    });

    describe("CLEAR_USER", () => {
        it("When CLEAR_USER action is dispatched, then it should clear user data", () => {
            const previousState = {
                user: {
                    userId: "user-123",
                    email: "test@example.com",
                },
                lastUpdated: 1610000000000,
            };

            const action = {
                type: CLEAR_USER,
            } as UserActionTypes;

            const result = userReducer(previousState as UserReducerState, action);

            expect(result).toEqual({
                user: null,
                lastUpdated: mockTimestamp,
            });
        });
    });

    describe("Unknown action", () => {
        it("When unknown action is dispatched, then it should return the original state", () => {
            const action = {
                type: "UNKNOWN_ACTION",
                payload: {},
            } as any;

            const result = userReducer(initialState, action);

            expect(result).toBe(initialState);
        });
    });
});
