import { Tier } from "@internxt/sdk/dist/drive/payments/types/tiers";
import { UserSubscription } from "@internxt/sdk/dist/drive/payments/types/types";
import { SdkManager } from "./sdk-manager.service";

export class PaymentsService {
    public static readonly instance: PaymentsService = new PaymentsService();

    /**
     * Gets the user's tier information.
     * This includes meeting availability, plan name, and all other service features.
     *
     * @returns Promise<Tier> The complete tier information
     */
    public getUserTier = async (): Promise<Tier> => {
        const paymentsClient = SdkManager.instance.getPayments();
        return paymentsClient.getUserTier();
    };

    public getUserSubscription = async (): Promise<UserSubscription> => {
        const paymentsClient = await SdkManager.instance.getPayments();
        return paymentsClient.getUserSubscription();
    };
}
