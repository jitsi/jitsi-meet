import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    isLeavingConferenceManually,
    setLeaveConferenceManually
} from "./conferenceState";

describe("conferenceState", () => {
    beforeEach(() => {
        setLeaveConferenceManually(false);
    });

    afterEach(() => {
        setLeaveConferenceManually(false);
    });

    describe("Initial State", () => {
        it("When initialized, then isLeavingConferenceManually should return false", () => {
            const result = isLeavingConferenceManually();

            expect(result).toBe(false);
        });
    });

    describe("State Management", () => {
        it("When setLeaveConferenceManually is called with true, then isLeavingConferenceManually should return true", () => {
            setLeaveConferenceManually(true);

            expect(isLeavingConferenceManually()).toBe(true);
        });

        it("When setLeaveConferenceManually is called with false, then isLeavingConferenceManually should return false", () => {
            setLeaveConferenceManually(false);

            expect(isLeavingConferenceManually()).toBe(false);
        });

        it("When setLeaveConferenceManually is called multiple times with different values, then it should reflect the latest value", () => {
            setLeaveConferenceManually(true);
            expect(isLeavingConferenceManually()).toBe(true);

            setLeaveConferenceManually(false);
            expect(isLeavingConferenceManually()).toBe(false);

            setLeaveConferenceManually(true);
            expect(isLeavingConferenceManually()).toBe(true);
        });

        it("When isLeavingConferenceManually is called multiple times without changes, then it should return the same value", () => {
            setLeaveConferenceManually(true);

            expect(isLeavingConferenceManually()).toBe(true);
            expect(isLeavingConferenceManually()).toBe(true);
            expect(isLeavingConferenceManually()).toBe(true);
        });
    });

    describe("Concurrent Access", () => {
        it("When reading state while setting, then latest value should be reflected", () => {
            setLeaveConferenceManually(true);
            const result1 = isLeavingConferenceManually();

            setLeaveConferenceManually(false);
            const result2 = isLeavingConferenceManually();

            expect(result1).toBe(true);
            expect(result2).toBe(false);
        });

        it("When performing rapid state changes, then final state should be correct", () => {
            for (let i = 0; i < 10; i++) {
                setLeaveConferenceManually(i % 2 === 0);
            }

            const result = isLeavingConferenceManually();

            expect(result).toBe(false);
        });
    });
});
