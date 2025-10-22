import { describe, expect, it } from "vitest";

import { IReduxState } from "../../../../../../app/types";
import { USER_REDUCER } from "../reducer";
import {
    getLastUpdated,
    getUser,
    getUserEmail,
    getUserFullName,
    getUserId,
    getUserState,
    isAuthenticated,
} from "../selectors";
import { User, UserReducerState } from "../types";

describe("User Selectors", () => {
    const createMockState = (userState: UserReducerState): IReduxState => {
        return {
            [USER_REDUCER]: userState,
        } as unknown as IReduxState;
    };

    describe("getUserState", () => {
        it("When called with state, then it should return the user reducer state", () => {
            const userState: UserReducerState = {
                user: {
                    userId: "user-123",
                    email: "test@example.com",
                    name: "John",
                    lastname: "Doe",
                } as unknown as User,
                lastUpdated: 1620000000000,
            };

            const mockState = createMockState(userState);
            const result = getUserState(mockState);

            expect(result).toEqual(userState);
        });
    });

    describe("getLastUpdated", () => {
        it("When user state has lastUpdated, then it should return the timestamp", () => {
            const timestamp = 1620000000000;
            const mockState = createMockState({
                user: null,
                lastUpdated: timestamp,
            });

            const result = getLastUpdated(mockState);

            expect(result).toBe(timestamp);
        });

        it("When user state has null lastUpdated, then it should return null", () => {
            const mockState = createMockState({
                user: null,
                lastUpdated: null,
            });

            const result = getLastUpdated(mockState);

            expect(result).toBe(null);
        });
    });

    describe("getUser", () => {
        it("When user exists in state, then it should return the user object", () => {
            const user = {
                userId: "user-123",
                email: "test@example.com",
                name: "John",
                lastname: "Doe",
            };

            const mockState = createMockState({
                user: user as unknown as User,
                lastUpdated: 1620000000000,
            });

            const result = getUser(mockState);

            expect(result).toEqual(user);
        });

        it("When user is null in state, then it should return null", () => {
            const mockState = createMockState({
                user: null,
                lastUpdated: 1620000000000,
            });

            const result = getUser(mockState);

            expect(result).toBe(null);
        });
    });

    describe("isAuthenticated", () => {
        it("When user exists in state, then it should return true", () => {
            const mockState = createMockState({
                user: {
                    userId: "user-123",
                    email: "test@example.com",
                } as unknown as User,
                lastUpdated: 1620000000000,
            });

            const result = isAuthenticated(mockState);

            expect(result).toBe(true);
        });

        it("When user is null in state, then it should return false", () => {
            const mockState = createMockState({
                user: null,
                lastUpdated: 1620000000000,
            });

            const result = isAuthenticated(mockState);

            expect(result).toBe(false);
        });
    });

    describe("getUserId", () => {
        it("When user exists with userId, then it should return the userId", () => {
            const userId = "user-123";
            const mockState = createMockState({
                user: {
                    uuid: userId,
                    email: "test@example.com",
                } as unknown as User,
                lastUpdated: 1620000000000,
            });

            const result = getUserId(mockState);

            expect(result).toBe(userId);
        });

        it("When user is null, then it should return null", () => {
            const mockState = createMockState({
                user: null,
                lastUpdated: 1620000000000,
            });

            const result = getUserId(mockState);

            expect(result).toBe(null);
        });
    });

    describe("getUserEmail", () => {
        it("When user exists with email, then it should return the email", () => {
            const email = "test@example.com";
            const mockState = createMockState({
                user: {
                    userId: "user-123",
                    email,
                } as unknown as User,
                lastUpdated: 1620000000000,
            });

            const result = getUserEmail(mockState);

            expect(result).toBe(email);
        });

        it("When user is null, then it should return null", () => {
            const mockState = createMockState({
                user: null,
                lastUpdated: 1620000000000,
            });

            const result = getUserEmail(mockState);

            expect(result).toBe(null);
        });
    });

    describe("getUserFullName", () => {
        it("When user exists with name and lastname, then it should return full name", () => {
            const mockState = createMockState({
                user: {
                    userId: "user-123",
                    email: "test@example.com",
                    name: "John",
                    lastname: "Doe",
                } as unknown as User,
                lastUpdated: 1620000000000,
            });

            const result = getUserFullName(mockState);

            expect(result).toBe("John Doe");
        });

        it("When user exists with only name, then it should return just the name", () => {
            const mockState = createMockState({
                user: {
                    userId: "user-123",
                    email: "test@example.com",
                    name: "John",
                    lastname: "",
                } as unknown as User,
                lastUpdated: 1620000000000,
            });

            const result = getUserFullName(mockState);

            expect(result).toBe("John");
        });

        it("When user exists with only lastname, then it should return just the lastname", () => {
            const mockState = createMockState({
                user: {
                    userId: "user-123",
                    email: "test@example.com",
                    name: "",
                    lastname: "Doe",
                } as unknown as User,
                lastUpdated: 1620000000000,
            });

            const result = getUserFullName(mockState);

            expect(result).toBe("Doe");
        });

        it("When user exists with empty name and lastname, then it should return null", () => {
            const mockState = createMockState({
                user: {
                    userId: "user-123",
                    email: "test@example.com",
                    name: "",
                    lastname: "",
                } as unknown as User,
                lastUpdated: 1620000000000,
            });

            const result = getUserFullName(mockState);

            expect(result).toBe(null);
        });

        it("When user is null, then it should return null", () => {
            const mockState = createMockState({
                user: null,
                lastUpdated: 1620000000000,
            });

            const result = getUserFullName(mockState);

            expect(result).toBe(null);
        });
    });
});
