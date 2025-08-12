import { UserSubscription } from "@internxt/sdk/dist/drive/payments/types/types";

/**
 * Utility function to get plan name from subscription
 */
const getPlanName = (subscription?: UserSubscription | null ): string => {
    if (!subscription) return "Free";

    switch (subscription.type) {
        case "free":
            return "Free";
        case "lifetime":
            return "Lifetime";
        case "subscription":
            if (subscription.plan?.name) {
                return subscription.plan.name;
            }
            return subscription.interval === "year" ? "Premium Annual" : "Premium Monthly";
        default:
            return "Free";
    }
};


export { getPlanName };
