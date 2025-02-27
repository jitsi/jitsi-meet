import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserData } from "../types";
import { useFullName } from "./useFullName";

describe("useFullName", () => {
    it("should return initial value when userData is null", () => {
        const initialValue = "John Doe";
        const { result } = renderHook(() => useFullName(null, initialValue));

        expect(result.current[0]).toBe(initialValue);
    });

    it("should return empty string when userData has no name and lastname", () => {
        const userData: any = {};
        const { result } = renderHook(() => useFullName(userData));

        expect(result.current[0]).toBe("");
    });

    it("should return full name when userData has both name and lastname", () => {
        const userData: UserData = {
            name: "John",
            lastname: "Doe",
            avatar: null,
        };
        const { result } = renderHook(() => useFullName(userData));

        expect(result.current[0]).toBe("John Doe");
    });

    it("should update when userData changes", () => {
        const initialUserData: UserData = {
            name: "John",
            lastname: "Doe",
            avatar: null,
        };

        const { result, rerender } = renderHook(({ userData }) => useFullName(userData), {
            initialProps: { userData: initialUserData },
        });

        expect(result.current[0]).toBe("John Doe");

        rerender({
            userData: {
                name: "Jane",
                lastname: "Smith",
                avatar: null,
            },
        });

        expect(result.current[0]).toBe("Jane Smith");
    });

    it("should allow manual name updates", () => {
        const { result } = renderHook(() => useFullName(null, ""));

        act(() => {
            result.current[1]("Jane Smith");
        });

        expect(result.current[0]).toBe("Jane Smith");
    });
});
