import { renderHook } from "@testing-library/react";
import { useSelector } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    getLocalParticipant,
    getParticipantDisplayName,
    getRemoteParticipants,
} from "../../../../participants/functions";
import { useParticipants } from "./useParticipants";

vi.mock("react-redux", () => ({
    useSelector: vi.fn(),
}));

vi.mock("../../../../participants/functions", () => ({
    getLocalParticipant: vi.fn(),
    getParticipantDisplayName: vi.fn(),
    getRemoteParticipants: vi.fn(),
}));

describe("useParticipants", () => {
    const mockState = {};

    const mockLocalParticipant = {
        id: "local-123",
        avatarURL: "local-avatar.jpg",
        role: "moderator",
        email: "local@test.com",
    };

    const mockRemoteParticipants = new Map([
        [
            "remote-1",
            {
                id: "remote-1",
                avatarURL: "remote1-avatar.jpg",
                role: "participant",
                email: "remote1@test.com",
            },
        ],
        [
            "remote-2",
            {
                id: "remote-2",
                avatarURL: "remote2-avatar.jpg",
                role: "participant",
                email: "remote2@test.com",
            },
        ],
    ]);

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useSelector).mockImplementation((selector) => {
            if (selector === getLocalParticipant) return mockLocalParticipant;
            if (selector === getRemoteParticipants) return mockRemoteParticipants;
            return mockState;
        });

        vi.mocked(getParticipantDisplayName).mockImplementation((state, id) => `Display Name for ${id}`);
    });

    it("should return empty arrays when no participants exist", () => {
        vi.mocked(useSelector).mockImplementation((selector) => {
            if (selector === getLocalParticipant) return null;
            if (selector === getRemoteParticipants) return new Map();
            return mockState;
        });

        const { result } = renderHook(() => useParticipants());

        expect(result.current.allParticipants).toHaveLength(0);
        expect(result.current.localParticipant).toBeNull();
        expect(result.current.remoteParticipants).toHaveLength(0);
    });

    it("should return correct local participant data", () => {
        const { result } = renderHook(() => useParticipants());

        expect(result.current.localParticipant).toEqual({
            id: mockLocalParticipant.id,
            name: `Display Name for ${mockLocalParticipant.id}`,
            avatar: mockLocalParticipant.avatarURL,
            role: mockLocalParticipant.role,
            isLocal: true,
            email: mockLocalParticipant.email,
        });
    });

    it("should return correct remote participants data", () => {
        const { result } = renderHook(() => useParticipants());

        expect(result.current.remoteParticipants).toHaveLength(2);
        expect(result.current.remoteParticipants[0]).toEqual({
            id: "remote-1",
            name: "Display Name for remote-1",
            avatar: "remote1-avatar.jpg",
            role: "participant",
            isLocal: false,
            email: "remote1@test.com",
        });
    });

    it("should combine local and remote participants correctly", () => {
        const { result } = renderHook(() => useParticipants());

        expect(result.current.allParticipants).toHaveLength(3);
        expect(result.current.allParticipants[0].isLocal).toBe(true);
        expect(result.current.allParticipants.slice(1).every((p) => !p.isLocal)).toBe(true);
    });

    it("should handle null local participant", () => {
        vi.mocked(useSelector).mockImplementation((selector) => {
            if (selector === getLocalParticipant) return null;
            if (selector === getRemoteParticipants) return mockRemoteParticipants;
            return mockState;
        });

        const { result } = renderHook(() => useParticipants());

        expect(result.current.localParticipant).toBeNull();
        expect(result.current.allParticipants).toHaveLength(2);
    });

    it("should handle empty remote participants", () => {
        vi.mocked(useSelector).mockImplementation((selector) => {
            if (selector === getLocalParticipant) return mockLocalParticipant;
            if (selector === getRemoteParticipants) return new Map();
            return mockState;
        });

        const { result } = renderHook(() => useParticipants());

        expect(result.current.remoteParticipants).toHaveLength(0);
        expect(result.current.allParticipants).toHaveLength(1);
    });

    it("should call getParticipantDisplayName with correct arguments", () => {
        renderHook(() => useParticipants());

        expect(getParticipantDisplayName).toHaveBeenCalledWith(mockState, mockLocalParticipant.id);
        expect(getParticipantDisplayName).toHaveBeenCalledWith(mockState, "remote-1");
        expect(getParticipantDisplayName).toHaveBeenCalledWith(mockState, "remote-2");
    });

    it("should maintain correct participant data structure", () => {
        const { result } = renderHook(() => useParticipants());
        const participant = result.current.allParticipants[0];

        expect(participant).toHaveProperty("id");
        expect(participant).toHaveProperty("name");
        expect(participant).toHaveProperty("avatar");
        expect(participant).toHaveProperty("role");
        expect(participant).toHaveProperty("isLocal");
        expect(participant).toHaveProperty("email");
    });
});
