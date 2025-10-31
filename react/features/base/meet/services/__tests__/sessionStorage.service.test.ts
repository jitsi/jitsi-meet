import { beforeEach, describe, expect, it, vi } from "vitest";
import "../../__tests__/setup";
import {
    clearNewMeetingFlowSession,
    clearSessionStorage,
    isNewMeetingFlow,
    setNewMeetingFlowSession,
} from "../sessionStorage.service";

describe("sessionStorage.service", () => {
    const createMockStorage = () => {
        let store: Record<string, string> = {};

        return {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            }),
            get length() {
                return Object.keys(store).length;
            },
            key: vi.fn((index: number) => Object.keys(store)[index] || null),
        };
    };

    let mockStorage: ReturnType<typeof createMockStorage>;

    beforeEach(() => {
        mockStorage = createMockStorage();
        Object.defineProperty(window, "sessionStorage", {
            value: mockStorage,
            writable: true,
            configurable: true,
        });
        vi.clearAllMocks();
    });

    describe("isNewMeetingFlow", () => {
        it("When flag is not set, then returns false", () => {
            expect(isNewMeetingFlow()).toBe(false);
        });

        it("When flag is set to 'true', then returns true", () => {
            mockStorage.setItem("isNewMeetingFlow", "true");
            expect(isNewMeetingFlow()).toBe(true);
        });

        it("When flag is set to 'false', then returns false", () => {
            mockStorage.setItem("isNewMeetingFlow", "false");
            expect(isNewMeetingFlow()).toBe(false);
        });

        it("When flag is set to any other value, then returns false", () => {
            mockStorage.setItem("isNewMeetingFlow", "invalid");
            expect(isNewMeetingFlow()).toBe(false);
        });

        it("When sessionStorage throws error, then returns false and logs error", () => {
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            mockStorage.getItem.mockImplementationOnce(() => {
                throw new Error("Storage error");
            });

            expect(isNewMeetingFlow()).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe("setNewMeetingFlowSession", () => {
        it("When value is true, then sets flag to 'true'", () => {
            setNewMeetingFlowSession(true);
            expect(mockStorage.setItem).toHaveBeenCalledWith("isNewMeetingFlow", "true");
            expect(isNewMeetingFlow()).toBe(true);
        });

        it("When value is false, then sets flag to 'false'", () => {
            setNewMeetingFlowSession(false);
            expect(mockStorage.setItem).toHaveBeenCalledWith("isNewMeetingFlow", "false");
            expect(isNewMeetingFlow()).toBe(false);
        });

        it("When sessionStorage throws error, then logs error", () => {
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            mockStorage.setItem.mockImplementationOnce(() => {
                throw new Error("Storage error");
            });

            setNewMeetingFlowSession(true);
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe("clearNewMeetingFlowSession", () => {
        it("When flag is set, then removes the flag from sessionStorage", () => {
            setNewMeetingFlowSession(true);
            expect(isNewMeetingFlow()).toBe(true);

            clearNewMeetingFlowSession();
            expect(mockStorage.removeItem).toHaveBeenCalledWith("isNewMeetingFlow");
            expect(isNewMeetingFlow()).toBe(false);
        });

        it("When sessionStorage throws error, then logs error", () => {
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            mockStorage.removeItem.mockImplementationOnce(() => {
                throw new Error("Storage error");
            });

            clearNewMeetingFlowSession();
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        it("When flag was never set, then does not throw error", () => {
            expect(() => clearNewMeetingFlowSession()).not.toThrow();
        });
    });

    describe("clearSessionStorage", () => {
        it("When called, then clears all items from sessionStorage", () => {
            mockStorage.setItem("isNewMeetingFlow", "true");
            mockStorage.setItem("userData", "test");
            mockStorage.setItem("otherKey", "value");

            clearSessionStorage();
            expect(mockStorage.clear).toHaveBeenCalled();
        });

        it("When sessionStorage throws error, then logs error", () => {
            const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            mockStorage.clear.mockImplementationOnce(() => {
                throw new Error("Storage error");
            });

            clearSessionStorage();
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });

    describe("Integration scenarios", () => {
        it("When user creates new meeting and connection succeeds, then flag lifecycle works correctly", () => {
            setNewMeetingFlowSession(true);
            expect(isNewMeetingFlow()).toBe(true);

            clearNewMeetingFlowSession();
            expect(isNewMeetingFlow()).toBe(false);
        });

        it("When user creates new meeting and connection fails, then flag is cleared for retry", () => {
            setNewMeetingFlowSession(true);
            expect(isNewMeetingFlow()).toBe(true);

            clearNewMeetingFlowSession();
            expect(isNewMeetingFlow()).toBe(false);

            expect(isNewMeetingFlow()).toBe(false);
        });

        it("When user joins existing meeting, then does not interfere with normal flow", () => {
            expect(isNewMeetingFlow()).toBe(false);

            clearNewMeetingFlowSession();
            expect(isNewMeetingFlow()).toBe(false);
        });
    });
});
