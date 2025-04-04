import "../../../__tests__/setup"
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthModal } from './useAuthModal';
import { AuthService } from '../../../services/auth.service';
import { get8x8BetaJWT } from '../../../../connection/options8x8';
import { useLocalStorage } from '../../../LocalStorageManager';

vi.mock('../../../services/auth.service');
vi.mock('../../../../connection/options8x8');
vi.mock('../../../LocalStorageManager');

describe('useAuthModal', () => {
    const mockOnClose = vi.fn();
    const mockOnLogin = vi.fn();
    const mockTranslate = vi.fn((key) => key);
    const mockSaveCredentials = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useLocalStorage as any).mockReturnValue({
            saveCredentials: mockSaveCredentials
        });
    });

    describe('Initial state', () => {
        it('When the modal is initialized, then it has default values', () => {
            const { result } = renderHook(() =>
                useAuthModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            expect(result.current.isLoggingIn).toBe(false);
            expect(result.current.showTwoFactor).toBe(false);
            expect(result.current.loginError).toBe('');
        });
    });

    describe('Login process', () => {
        it('When logging in with valid credentials without 2FA, then the login completes successfully', async () => {
            const mockCredentials = {
                newToken: 'new-token',
                user: { id: 1 },
                token: 'token',
                mnemonic: 'mnemonic'
            };
            const mockMeetToken = {
                token: 'meet-token',
                room: 'room-id'
            };

            (AuthService.instance.doLogin as any).mockResolvedValue(mockCredentials);
            (AuthService.instance.is2FANeeded as any).mockResolvedValue(false);
            (get8x8BetaJWT as any).mockResolvedValue(mockMeetToken);

            const { result } = renderHook(() =>
                useAuthModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            await act(async () => {
                await result.current.handleLogin({
                    email: 'test@example.com',
                    password: 'password'
                });
            });

            expect(mockSaveCredentials).toHaveBeenCalledWith(
                mockCredentials.token,
                mockCredentials.newToken,
                mockCredentials.mnemonic,
                mockCredentials.user
            );
            expect(mockOnLogin).toHaveBeenCalledWith(mockCredentials.newToken);
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('When 2FA is enabled for the user, then the 2FA screen is displayed', async () => {
            (AuthService.instance.is2FANeeded as any).mockResolvedValue(true);

            const { result } = renderHook(() =>
                useAuthModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            await act(async () => {
                await result.current.handleLogin({
                    email: 'test@example.com',
                    password: 'password'
                });
            });

            expect(result.current.showTwoFactor).toBe(true);
        });

        it('When logging in with invalid credentials, then an error message is displayed', async () => {
            (AuthService.instance.doLogin as any).mockRejectedValue(new Error('Invalid credentials'));
            (AuthService.instance.is2FANeeded as any).mockResolvedValue(false);

            const { result } = renderHook(() =>
                useAuthModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            await act(async () => {
                await result.current.handleLogin({
                    email: 'test@example.com',
                    password: 'wrong-password'
                });
            });

            expect(result.current.loginError).toBe('meet.auth.modal.error.invalidCredentials');
            expect(mockOnLogin).not.toHaveBeenCalled();
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('State management', () => {
        it('When resetState is called, then all state values are reset to default', () => {
            const { result } = renderHook(() =>
                useAuthModal({ onClose: mockOnClose, onLogin: mockOnLogin, translate: mockTranslate })
            );

            act(() => {
                result.current.resetState();
            });

            expect(result.current.showTwoFactor).toBe(false);
            expect(result.current.loginError).toBe('');
        });
    });
});