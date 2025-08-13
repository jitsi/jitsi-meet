import { UserSubscription } from "@internxt/sdk/dist/drive/payments/types/types";
import { filesize } from "filesize";

/**
 * Utility function to get plan name from subscription
 */
const getPlanName = (subscription?: UserSubscription | null): string => {
    if (!subscription) return "Free";

    switch (subscription.type) {
        case "free":
            return "Free";
        case "lifetime":
            return "Lifetime";
        case "subscription":
            // if (subscription.plan?.name) {
            //     return subscription.plan.name;
            // }
            const planBytesName = subscription.plan?.storageLimit
                ? filesize(subscription.plan.storageLimit, { round: 0 })
                : "";
            console.log("Plan bytes name:", planBytesName);
            return planBytesName;
        default:
            return "Free";
    }
};


export { getPlanName };
