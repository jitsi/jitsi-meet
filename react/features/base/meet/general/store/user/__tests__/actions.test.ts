import { describe, expect, it, vi } from "vitest";

import { IReduxState } from "../../../../../../app/types";
import { LocalStorageManager } from "../../../../LocalStorageManager";
import { clearUser, initializeUser, setUser, updateUser } from "../actions";
import { CLEAR_USER, SET_USER, UPDATE_USER } from "../actionTypes";

vi.mock("../../../../LocalStorageManager", () => ({
    LocalStorageManager: {
        instance: {
            getUser: vi.fn(),
        },
    },
}));

describe("User Actions", () => {
    describe("setUser", () => {
        it("When called with user object, then it should return the correct action", () => {
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

            const result = setUser(mockUser);

            expect(result).toEqual({
                type: SET_USER,
                payload: mockUser,
            });
        });

        it("When called with null, then it should return action with null payload", () => {
            const result = setUser(null);

            expect(result).toEqual({
                type: SET_USER,
                payload: null,
            });
        });
    });

    describe("updateUser", () => {
        it("When called with partial user data, then it should return the correct action", () => {
            const partialUserData = {
                name: "Jane",
                lastname: "Smith",
            };

            const result = updateUser(partialUserData);

            expect(result).toEqual({
                type: UPDATE_USER,
                payload: partialUserData,
            });
        });
    });

    describe("clearUser", () => {
        it("When called, then it should return the correct action", () => {
            const result = clearUser();

            expect(result).toEqual({
                type: CLEAR_USER,
            });
        });
    });

    describe("initializeUser", () => {
        it("When user exists in local storage, then it should dispatch setUser", () => {
            const mockUser = {
                userId: "user-456",
                email: "test@example.com",
            };


            (LocalStorageManager.instance.getUser as any).mockReturnValue(mockUser);

            const dispatch = vi.fn();


            const thunk = initializeUser();
            thunk(dispatch, () => ({} as unknown as IReduxState), undefined);

            expect(dispatch).toHaveBeenCalledWith({
                type: SET_USER,
                payload: mockUser,
            });
        });

        it("When user does not exist in local storage, then it should not dispatch", () => {

            (LocalStorageManager.instance.getUser as any ).mockReturnValue(null);

            const dispatch = vi.fn();


            const thunk = initializeUser();
            thunk(dispatch, () => ({} as unknown as IReduxState), undefined);

            expect(dispatch).not.toHaveBeenCalled();
        });
    });
});
