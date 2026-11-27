import { IJitsiConference } from '../base/conference/reducer';

/**
 * The moderator settings props (as returned by {@code getModeratorTabProps}) that hold the value of a permission
 * toggle.
 */
export type ModeratorPermissionPropKey = 'breakoutRoomJoinWithPermissionsEnabled' | 'chatWithPermissionsEnabled'
    | 'privateChatWithPermissionsEnabled' | 'sharedVideoWithPermissionsEnabled';

/**
 * The values of the permission toggles, keyed by their props key.
 */
export type ModeratorPermissionValues = Partial<Record<ModeratorPermissionPropKey, boolean>>;

/**
 * The moderator settings props that decide whether a permission toggle is shown.
 */
export interface IModeratorPermissionVisibilityProps {
    hideChatWithPermissions: boolean;
    showBreakoutRoomJoinWithPermissions: boolean;
    showSharedVideoWithPermissions: boolean;
}

/**
 * The definition of a moderator setting that is saved into the {@code permissions} conference metadata.
 */
export interface IModeratorPermissionSetting {

    /**
     * Returns whether the toggle is shown.
     */
    isShown: (props: IModeratorPermissionVisibilityProps) => boolean;

    /**
     * The translation key of the toggle's label.
     */
    labelKey: string;

    /**
     * The key of the {@code permissions} conference metadata the value is saved into.
     */
    metadataKey: string;

    /**
     * The name of the toggle's form element (web).
     */
    name: string;

    /**
     * The key of the moderator settings props holding the toggle's value.
     */
    propKey: ModeratorPermissionPropKey;
}

/**
 * The moderator permission toggles, in the order in which they are displayed.
 */
export const MODERATOR_PERMISSION_SETTINGS: ReadonlyArray<IModeratorPermissionSetting> = [
    {
        isShown: ({ hideChatWithPermissions }) => !hideChatWithPermissions,
        labelKey: 'settings.chatWithPermissions',
        metadataKey: 'groupChatRestricted',
        name: 'chat-with-permissions',
        propKey: 'chatWithPermissionsEnabled'
    },
    {
        isShown: ({ hideChatWithPermissions }) => !hideChatWithPermissions,
        labelKey: 'settings.privateChatWithPermissions',
        metadataKey: 'privateChatRestricted',
        name: 'private-chat-with-permissions',
        propKey: 'privateChatWithPermissionsEnabled'
    },
    {
        isShown: ({ showSharedVideoWithPermissions }) => showSharedVideoWithPermissions,
        labelKey: 'settings.sharedVideoWithPermissions',
        metadataKey: 'sharedVideoRestricted',
        name: 'shared-video-with-permissions',
        propKey: 'sharedVideoWithPermissionsEnabled'
    },
    {
        isShown: ({ showBreakoutRoomJoinWithPermissions }) => showBreakoutRoomJoinWithPermissions,
        labelKey: 'settings.breakoutRoomJoinWithPermissions',
        metadataKey: 'breakoutRoomJoinRestricted',
        name: 'breakout-room-join-with-permissions',
        propKey: 'breakoutRoomJoinWithPermissionsEnabled'
    }
];

/**
 * Returns whether any of the permission toggles has a different value in the two given states.
 *
 * @param {ModeratorPermissionValues} newState - The new values.
 * @param {ModeratorPermissionValues} currentState - The current values.
 * @returns {boolean}
 */
export function haveModeratorPermissionsChanged(
        newState: ModeratorPermissionValues, currentState: ModeratorPermissionValues) {
    return MODERATOR_PERMISSION_SETTINGS.some(({ propKey }) => newState[propKey] !== currentState[propKey]);
}

/**
 * Saves the given permission toggle values into the {@code permissions} conference metadata, keeping the rest of
 * the current permissions.
 *
 * All permissions are set in a single metadata update. The metadata only changes once the server confirms it, so
 * separate consecutive updates would each start from the same stale permissions and overwrite one another.
 *
 * @param {IJitsiConference|undefined} conference - The conference whose metadata to update.
 * @param {ModeratorPermissionValues} values - The toggle values, keyed by their props key.
 * @returns {void}
 */
export function setModeratorPermissions(conference: IJitsiConference | undefined, values: ModeratorPermissionValues) {
    const permissions = { ...conference?.getMetadataHandler().getMetadata().permissions };

    MODERATOR_PERMISSION_SETTINGS.forEach(({ metadataKey, propKey }) => {
        permissions[metadataKey] = values[propKey];
    });

    conference?.getMetadataHandler().setMetadata('permissions', permissions);
}
