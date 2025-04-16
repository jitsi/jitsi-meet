import testPasswordStrength from "@internxt/lib/dist/src/auth/testPasswordStrength";
import { act, renderHook } from "@testing-library/react-hooks";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePasswordStrength } from "./usePasswordStrength";

describe("usePasswordStrength", () => {
    const mockTranslate = vi.fn((key) => {
        const translations = {
            "meet.auth.modal.signup.password.weak": "Password is weak",
            "meet.auth.modal.signup.password.strong": "Password is strong",
            "meet.auth.modal.signup.password.notComplex": "Password is not complex enough",
            "meet.auth.modal.signup.error.passwordTooShort": "Password has to be at least 8 characters long",
            "meet.auth.modal.signup.password.tooLong": "Password is too long",
        };
        return translations[key] || key;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Initial state", () => {
        it("When the hook is initialized, then default values are set correctly", () => {
            const { result } = renderHook(() =>
                usePasswordStrength({
                    password: "",
                    email: "",
                    translate: mockTranslate,
                })
            );

            expect(result.current.isValidPassword).toBe(false);
            expect(result.current.passwordState).toBeNull();
            expect(result.current.showPasswordIndicator).toBe(false);
        });
    });

    describe("Password validation", () => {
        it("When different passwords are provided, then they are validated according to testPasswordStrength results", () => {
            const weakPassResult = testPasswordStrength("weakpass", "test@example.com");

            const { result, rerender } = renderHook((props) => usePasswordStrength(props), {
                initialProps: {
                    password: "weakpass",
                    email: "test@example.com",
                    translate: mockTranslate,
                },
            });

            expect(result.current.isValidPassword).toBe(weakPassResult.valid);

            const strongPassResult = testPasswordStrength("strongpass123!", "test@example.com");

            rerender({
                password: "strongpass123!",
                email: "test@example.com",
                translate: mockTranslate,
            });

            expect(result.current.isValidPassword).toBe(strongPassResult.valid);

            const shortPassResult = testPasswordStrength("123", "test@example.com");

            rerender({
                password: "123",
                email: "test@example.com",
                translate: mockTranslate,
            });

            expect(result.current.isValidPassword).toBe(shortPassResult.valid);
            expect(result.current.passwordState?.tag).toBe("error");

            const simplePassResult = testPasswordStrength("12345678", "test@example.com");

            rerender({
                password: "12345678",
                email: "test@example.com",
                translate: mockTranslate,
            });

            expect(result.current.isValidPassword).toBe(simplePassResult.valid);
            expect(result.current.passwordState?.tag).toBe("error");
        });

        it("When a password exceeds max length, then it is marked as invalid with appropriate error", () => {
            const longPassword = "a".repeat(65);

            const { result } = renderHook(() =>
                usePasswordStrength({
                    password: longPassword,
                    email: "test@example.com",
                    translate: mockTranslate,
                    maxLength: 64,
                })
            );

            expect(result.current.isValidPassword).toBe(false);
            expect(result.current.passwordState).toEqual({
                tag: "error",
                label: "Password is too long",
            });
        });
    });

    describe("Password indicator", () => {
        it("When handleShowPasswordIndicator is called, then the indicator visibility changes accordingly", () => {
            const { result } = renderHook(() =>
                usePasswordStrength({
                    password: "",
                    email: "",
                    translate: mockTranslate,
                })
            );

            expect(result.current.showPasswordIndicator).toBe(false);

            act(() => {
                result.current.handleShowPasswordIndicator(true);
            });

            expect(result.current.showPasswordIndicator).toBe(true);

            act(() => {
                result.current.handleShowPasswordIndicator(false);
            });

            expect(result.current.showPasswordIndicator).toBe(false);
        });
    });

    describe("Manual validation", () => {
        it("When validatePassword is called manually, then the password is validated correctly", () => {
            const { result } = renderHook(() =>
                usePasswordStrength({
                    password: "",
                    email: "test@example.com",
                    translate: mockTranslate,
                })
            );

            expect(result.current.isValidPassword).toBe(false);

            const strongPassResult = testPasswordStrength("strongpass123!", "test@example.com");

            act(() => {
                result.current.validatePassword("strongpass123!");
            });

            expect(result.current.isValidPassword).toBe(strongPassResult.valid);
        });
    });

    describe("Email dependency", () => {
        it("When email or password changes, then validation is updated accordingly", () => {
            const initialProps = {
                password: "strongpass123!",
                email: "test@example.com",
                translate: mockTranslate,
            };

            const strongPassResult = testPasswordStrength("strongpass123!", "test@example.com");

            const { result, rerender } = renderHook((props) => usePasswordStrength(props), {
                initialProps,
            });

            expect(result.current.isValidPassword).toBe(strongPassResult.valid);

            rerender({
                ...initialProps,
                password: "123",
            });

            expect(result.current.isValidPassword).toBe(false);
            expect(result.current.passwordState?.tag).toBe("error");

            rerender(initialProps);

            expect(result.current.isValidPassword).toBe(strongPassResult.valid);
        });
    });

    describe("Translation functionality", () => {
        it("When the hook is used with a translator, then appropriate translation keys are used", () => {
            const { result } = renderHook(() =>
                usePasswordStrength({
                    password: "123",
                    email: "test@example.com",
                    translate: mockTranslate,
                })
            );

            expect(result.current.passwordState?.tag).toBe("error");
            expect(mockTranslate).toHaveBeenCalled();

            mockTranslate.mockClear();

            act(() => {
                result.current.validatePassword("a".repeat(65));
            });

            expect(mockTranslate).toHaveBeenCalledWith("meet.auth.modal.signup.password.tooLong");
        });
    });
});
