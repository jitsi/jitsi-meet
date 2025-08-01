import { SdkManager } from "./sdk-manager.service";

export class PaymentsService {
    public static readonly instance: PaymentsService = new PaymentsService();

    public checkMeetAvailability = async () => {
        const paymentsClient = SdkManager.instance.getPayments();
        const userTier = await paymentsClient.getUserTier();
        const meetObject = userTier.featuresPerService["meet"];

        return meetObject;
    };
}
