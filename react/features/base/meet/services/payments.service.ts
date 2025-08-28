import { UserSubscription } from "@internxt/sdk/dist/drive/payments/types/types";
import { SdkManager } from "./sdk-manager.service";

export class PaymentsService {
    public static readonly instance: PaymentsService = new PaymentsService();

    public checkMeetAvailability = async () => {
        const paymentsClient = SdkManager.instance.getPayments();
        const userTier = await paymentsClient.getUserTier();
        const meetObject = userTier.featuresPerService["meet"];

        return meetObject;
    };

    public getUserSubscription = async (): Promise<UserSubscription> => {
        const paymentsClient = await SdkManager.instance.getPayments();
        return paymentsClient.getUserSubscription();
    };
}
