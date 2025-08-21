import { Auth, Drive, Meet } from "@internxt/sdk";
import { ApiSecurity, AppDetails } from "@internxt/sdk/dist/shared";
import packageJson from "../../../../../package.json";
import LocalStorageManager from "../LocalStorageManager";
import { ConfigService } from "./config.service";

export type SdkManagerApiSecurity = ApiSecurity & { newToken: string };
/**
 * Manages all the sdk submodules initialization
 * based on the current apiSecurity details
 */
export class SdkManager {
    public static readonly instance: SdkManager = new SdkManager();
    private static apiSecurity?: SdkManagerApiSecurity;
    private readonly localStorage = LocalStorageManager;

    /**
     * Sets the security details needed to create SDK clients
     * @param apiSecurity Security properties to be setted
     **/
    public static readonly init = (apiSecurity: SdkManagerApiSecurity) => {
        SdkManager.apiSecurity = apiSecurity;
    };

    /**
     * Cleans the security details
     **/
    public static readonly clean = () => {
        SdkManager.apiSecurity = undefined;
    };

    /**
     * Returns the security details needed to create SDK clients
     * @param config Config object to handle error throwing when there is not apiSecurity defined
     * @throws {Error} When throwErrorOnMissingCredentials is setted to true and there is not apiSecurity defined
     * @returns The SDK Manager api security details
     **/
    public static readonly getApiSecurity = (
        config = { throwErrorOnMissingCredentials: true }
    ): SdkManagerApiSecurity => {
        if (!SdkManager.apiSecurity && config.throwErrorOnMissingCredentials)
            throw new Error("Api security properties not found in SdkManager");

        return SdkManager.apiSecurity as SdkManagerApiSecurity;
    };

    private getNewTokenApiSecurity(): ApiSecurity {
        return {
            token: localStorage.getItem("xNewToken") ?? "",
            unauthorizedCallback: () => {
                if (this.localStorage.clearCredentials) {
                    this.localStorage.clearCredentials();
                }
            },
        };
    }

    /**
     * Returns the application details from package.json
     * @returns The name and the version of the app from package.json
     **/
    public static readonly getAppDetails = (): AppDetails => {
        return {
            clientName: packageJson.name,
            clientVersion: packageJson.version,
        };
    };

    getNewAuth() {
        const DRIVE_NEW_API_URL = ConfigService.instance.get("DRIVE_NEW_API_URL");

        const apiSecurity = SdkManager.getApiSecurity({ throwErrorOnMissingCredentials: false });
        const appDetails = SdkManager.getAppDetails();

        return Auth.client(DRIVE_NEW_API_URL, appDetails, apiSecurity);
    }

    /** Users SDK */
    getUsers() {
        const DRIVE_NEW_API_URL = ConfigService.instance.get("DRIVE_NEW_API_URL");

        const apiSecurity = SdkManager.getApiSecurity({ throwErrorOnMissingCredentials: false });
        const appDetails = SdkManager.getAppDetails();

        return Drive.Users.client(DRIVE_NEW_API_URL, appDetails, apiSecurity);
    }

    /** Payments SDK */
    getPayments() {
        const PAYMENTS_API_URL = ConfigService.instance.get("PAYMENTS_API_URL");

        const apiSecurity = this.getNewTokenApiSecurity();
        const appDetails = SdkManager.getAppDetails();

        return Drive.Payments.client(PAYMENTS_API_URL, appDetails, apiSecurity);
    }

    /** Meet SDK */
    getMeet() {
        const MEET_API_URL = ConfigService.instance.get("MEET_API_URL");

        const apiSecurity = this.getNewTokenApiSecurity();
        const appDetails = SdkManager.getAppDetails();

        return Meet.client(MEET_API_URL, appDetails, apiSecurity);
    }
}
