/**
 * The type of the {@code api} object available in the Always-on-Top window.
 */
export interface IAlwaysOnTopAPI {

    /**
     * Executes a command in the main app.
     *
     * @param command - The command to execute.
     * @param args - The arguments of the command.
     */
    executeCommand: (command: string, ...args: any[]) => void;

    /**
     * Gets the custom avatar backgrounds.
     */
    getCustomAvatarBackgrounds: () => Promise<{ avatarBackgrounds?: string[] }>;

    /**
     * Gets the avatar URL of a participant.
     *
     * @param id - The ID of the participant.
     */
    getAvatarURL: (id: string) => string;

    /**
     * Gets the display name of a participant.
     *
     * @param id - The ID of the participant.
     */
    getDisplayName: (id: string) => string;

    /**
     * Gets whether audio is available or not.
     */
    isAudioAvailable: () => Promise<boolean>;

    /**
     * Gets whether audio is disabled or not.
     */
    isAudioDisabled?: () => Promise<boolean>;

    /**
     * Gets whether audio is muted or not.
     */
    isAudioMuted: () => Promise<boolean>;

    /**
     * Gets whether video is available or not.
     */
    isVideoAvailable: () => Promise<boolean>;

    /**
     * Gets whether video is muted or not.
     */
    isVideoMuted: () => Promise<boolean>;

    /**
     * Indicates if the local participant is a visitor.
     */
    isVisitor?: () => boolean;

    /**
     * Registers a listener for an event.
     *
     * @param eventName - The name of the event.
     * @param handler - The handler of the event.
     */
    on: (eventName: string, handler: Function) => void;

    /**
     * Removes a listener for an event.
     *
     * @param eventName - The name of the event.
     * @param handler - The handler of the event.
     */
    removeListener: (eventName: string, handler: Function) => void;

    /**
     * Gets the formatted display name of a participant.
     *
     * @param id - The ID of the participant.
     */
    _getFormattedDisplayName: (id: string) => string;

    /**
     * Gets the ID of the participant who is currently on stage.
     */
    _getOnStageParticipant: () => string;

    /**
     * Gets the large video.
     */
    _getLargeVideo: () => any;

    /**
     * Gets the prejoin video.
     */
    _getPrejoinVideo: () => any;
}
