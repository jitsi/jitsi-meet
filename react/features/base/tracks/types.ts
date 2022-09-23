export interface TrackOptions {
    cameraDeviceId?: string | null;
    constraints?: {
        video?: {
            height?: {
                ideal?: number;
                max?: number;
                min?: number;
            };
        };
    };
    desktopSharingSourceDevice?: string;
    desktopSharingSources?: string[];
    devices?: string[];
    facingMode?: string;
    firePermissionPromptIsShownEvent?: boolean;
    fireSlowPromiseEvent?: boolean;
    micDeviceId?: string | null;
    timeout?: number;
}
