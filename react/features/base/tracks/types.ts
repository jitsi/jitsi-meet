export interface ITrackOptions {
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

export interface IToggleScreenSharingOptions {
    audioOnly: boolean;
    enabled?: boolean;
    shareOptions: IShareOptions;
}

export interface IShareOptions {
    desktopSharingSourceDevice?: string;
    desktopSharingSources?: string[];
    desktopStream?: any;
}
