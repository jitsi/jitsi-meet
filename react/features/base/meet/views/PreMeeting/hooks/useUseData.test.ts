import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUserData } from "./useUserData";

describe("useUserData", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it("should return null when no user data exists", () => {
        const { result } = renderHook(() => useUserData());
        expect(result.current).toBeNull();
    });

    it("should return parsed user data", () => {
        const mockUser = { id: 1, name: "John" };
        localStorage.setItem("xUser", JSON.stringify(mockUser));

        const { result } = renderHook(() => useUserData());
        expect(result.current).toEqual(mockUser);
    });

    it("should handle invalid JSON", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        localStorage.setItem("xUser", "invalid-json");

        const { result } = renderHook(() => useUserData());

        expect(result.current).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
    });

    it("should memoize parsed result", () => {
        const mockUser = { id: 1, name: "John" };
        localStorage.setItem("xUser", JSON.stringify(mockUser));

        const { result, rerender } = renderHook(() => useUserData());
        const firstResult = result.current;

        rerender();

        expect(result.current).toBe(firstResult);
    });
});
