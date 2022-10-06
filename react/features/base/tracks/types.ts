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
    micDeviceId?: string | null;
    timeout?: number;
}

export interface ToggleScreenSharingOptions {
    audioOnly: boolean;
    enabled?: boolean;
    shareOptions: ShareOptions;
}

export interface ShareOptions {
    desktopSharingSourceDevice?: string;
    desktopSharingSources?: string[];
    desktopStream?: any;
}
