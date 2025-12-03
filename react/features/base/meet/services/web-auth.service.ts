import { AuthService } from './auth.service';
import { ConfigService } from './config.service';
import { LoginCredentials } from './types/command.types';
import {
    WEB_AUTH_CONFIG,
    WEB_AUTH_MESSAGE_TYPES,
    WEB_AUTH_STORAGE_KEYS,
    WebAuthMessage,
    WebAuthParams,
} from './types/web-auth.types';

export class WebAuthService {
    public static readonly instance: WebAuthService = new WebAuthService();

    private readonly WEB_CLIENT_URL = ConfigService.instance.isDevelopment()
        ? "http://localhost:3000"
        : "https://drive.internxt.com";

    private authPopup: Window | null = null;
    private messageListener: ((event: MessageEvent) => void) | null = null;
    private popupCheckInterval: number | null = null;

    /**
     * Get the web auth URLs for login and signup
     */
    public get urls() {
        return {
            login: `${this.WEB_CLIENT_URL}${WEB_AUTH_CONFIG.loginPath}?${WEB_AUTH_CONFIG.authOriginParam}`,
            signup: `${this.WEB_CLIENT_URL}${WEB_AUTH_CONFIG.signupPath}?${WEB_AUTH_CONFIG.authOriginParam}`,
        };
    }

    /**
     * Calculate popup position to center it on screen
     */
    private calculatePopupPosition() {
        const left = window.screen.width / 2 - WEB_AUTH_CONFIG.popupWidth / 2;
        const top = window.screen.height / 2 - WEB_AUTH_CONFIG.popupHeight / 2;

        return { left, top };
    }

    /**
     * Build popup window features string
     */
    private buildPopupFeatures(left: number, top: number): string {
        return [
            `width=${WEB_AUTH_CONFIG.popupWidth}`,
            `height=${WEB_AUTH_CONFIG.popupHeight}`,
            `left=${left}`,
            `top=${top}`,
            "toolbar=no",
            "menubar=no",
            "location=no",
            "status=no",
        ].join(",");
    }

    /**
     * Opens a popup window for web authentication
     * @param url The URL to open in the popup
     * @returns Window reference or null if popup was blocked
     */
    private openAuthPopup(url: string): Window | null {
        const { left, top } = this.calculatePopupPosition();
        const features = this.buildPopupFeatures(left, top);

        const popup = window.open(url, WEB_AUTH_CONFIG.popupName, features);

        return popup;
    }

    /**
     * Validate origin of postMessage event
     */
    private isValidOrigin(origin: string): boolean {
        return origin.includes("internxt.com") || origin.includes("localhost");
    }

    /**
     * Validate authentication parameters
     */
    private validateAuthParams(params: Partial<WebAuthParams>): params is WebAuthParams {
        return !!(params.mnemonic && params.newToken);
    }

    /**
     * Handle auth success message
     */
    private handleAuthSuccess(
        data: WebAuthMessage,
        resolve: (value: WebAuthParams) => void,
        reject: (reason: Error) => void,
        timeout: number
    ) {
        clearTimeout(timeout);
        this.cleanup();

        const { payload } = data;

        if (!payload || !this.validateAuthParams(payload)) {
            reject(new Error("Missing authentication parameters"));
            return;
        }

        resolve(payload);
    }

    /**
     * Handle auth error message
     */
    private handleAuthError(data: WebAuthMessage, reject: (reason: Error) => void, timeout: number) {
        clearTimeout(timeout);
        this.cleanup();
        reject(new Error(data.error || "Authentication failed"));
    }

    /**
     * Setup popup closed checker interval
     */
    private setupPopupClosedChecker(
        popup: Window,
        reject: (reason: Error) => void,
        timeout: number
    ): number {
        return setInterval(() => {
            if (popup.closed) {
                clearInterval(this.popupCheckInterval!);
                clearTimeout(timeout);
                this.cleanup();
                reject(new Error("Authentication cancelled by user"));
            }
        }, WEB_AUTH_CONFIG.popupCheckIntervalMs);
    }

    /**
     * Waits for authentication response from the popup window
     * @param popup The popup window reference
     * @returns Promise that resolves with the authentication parameters
     */
    private waitForAuthResponse(popup: Window): Promise<WebAuthParams> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.cleanup();
                reject(new Error("Authentication timeout"));
            }, WEB_AUTH_CONFIG.authTimeoutMs);

            this.messageListener = (event: MessageEvent<WebAuthMessage>) => {
                if (!this.isValidOrigin(event.origin)) {
                    console.warn("Invalid origin for auth message:", event.origin);
                    return;
                }

                const { data } = event;

                if (data?.type === WEB_AUTH_MESSAGE_TYPES.SUCCESS) {
                    this.handleAuthSuccess(data, resolve, reject, timeout);
                }

                if (data?.type === WEB_AUTH_MESSAGE_TYPES.ERROR) {
                    this.handleAuthError(data, reject, timeout);
                }
            };

            window.addEventListener("message", this.messageListener);

            this.popupCheckInterval = this.setupPopupClosedChecker(popup, reject, timeout);
        });
    }

    /**
     * Cleanup popup and event listeners
     */
    private cleanup() {
        if (this.authPopup && !this.authPopup.closed) {
            this.authPopup.close();
        }
        this.authPopup = null;

        if (this.messageListener) {
            window.removeEventListener("message", this.messageListener);
            this.messageListener = null;
        }

        if (this.popupCheckInterval) {
            clearInterval(this.popupCheckInterval);
            this.popupCheckInterval = null;
        }
    }

    /**
     * Decode base64 parameter
     */
    private decodeBase64Param(param: string): string {
        return Buffer.from(param, "base64").toString("utf-8");
    }

    /**
     * Store tokens in localStorage
     */
    private storeTokens(newToken: string): void {
        localStorage.setItem(WEB_AUTH_STORAGE_KEYS.NEW_TOKEN, newToken);
    }

    /**
     * Fetch user data with provided tokens
     */
    private async fetchUserData() {
        const { user } = await AuthService.instance.refreshUserAndTokens();
        return user;
    }

    /**
     * Build login credentials response
     */
    private buildLoginCredentials(user: any, mnemonic: string, newToken: string): LoginCredentials {
        return {
            user: {
                ...user,
                mnemonic,
            } as unknown as LoginCredentials["user"],
            token: "", // Token is not used in web auth flow, remove when remove all old token references
            newToken,
            mnemonic,
        };
    }

    /**
     * Process web authentication parameters and return login credentials
     * @param params The authentication parameters from the web
     * @returns The processed login credentials
     */
    private async processWebAuthParams(params: WebAuthParams): Promise<LoginCredentials> {
        try {
            const mnemonic = this.decodeBase64Param(params.mnemonic);
            const newToken = this.decodeBase64Param(params.newToken);
            this.storeTokens(newToken);

            const user = await this.fetchUserData();
            return this.buildLoginCredentials(user, mnemonic, newToken);
        } catch (error) {
            throw new Error(
                `Web authentication processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    }

    /**
     * Execute web authentication flow
     */
    private async executeWebAuth(url: string): Promise<LoginCredentials> {
        try {
            this.authPopup = this.openAuthPopup(url);

            if (!this.authPopup) {
                throw new Error("Failed to open authentication popup. Please check your popup blocker settings.");
            }

            const authParams = await this.waitForAuthResponse(this.authPopup);
            return await this.processWebAuthParams(authParams);
        } catch (error) {
            this.cleanup();
            throw error;
        }
    }

    /**
     * Initiates web-based login flow
     * @returns Promise that resolves with login credentials
     */
    public async loginWithWeb(): Promise<LoginCredentials> {
        return this.executeWebAuth(this.urls.login);
    }

    /**
     * Initiates web-based signup flow
     * @returns Promise that resolves with login credentials
     */
    public async signupWithWeb(): Promise<LoginCredentials> {
        return this.executeWebAuth(this.urls.signup);
    }
}
