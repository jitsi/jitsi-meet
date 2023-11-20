import { CONNECTION_TYPE } from './constants';


/**
 * The avatar size to container size ration.
 */
const ratio = 1 / 3;

/**
 * The max avatar size.
 */
const maxSize = 190;

/**
 * The window limit height over which the avatar should have the default dimension.
 */
const upperHeightLimit = 760;

/**
 * The window limit height under which the avatar should not be resized anymore.
 */
const lowerHeightLimit = 460;

/**
 * The default top margin of the avatar.
 */
const defaultMarginTop = '10%';

/**
 * The top margin of the avatar when its dimension is small.
 */
const smallMarginTop = '5%';

/**
 * Calculates avatar dimensions based on window height and position.
 *
 * @param {number} height - The window height.
 * @returns {{
 *   marginTop: string,
 *   size: number
 * }}
 */
export function calculateAvatarDimensions(height: number) {
    if (height > upperHeightLimit) {
        return {
            size: maxSize,
            marginTop: defaultMarginTop
        };
    }

    if (height > lowerHeightLimit) {
        const diff = height - lowerHeightLimit;
        const percent = diff * ratio;
        const size = Math.floor(maxSize * percent / 100);
        let marginTop = defaultMarginTop;

        if (height < 600) {
            marginTop = smallMarginTop;
        }

        return {
            size,
            marginTop
        };
    }

    return {
        size: 0,
        marginTop: '0'
    };
}

/**
 * Selector for determining the connection type & details.
 *
 * @returns {{
 *   connectionType: string,
 *   connectionDetails: string[]
 * }}
 */
export function getConnectionData() {
    return {
        connectionType: CONNECTION_TYPE.NONE,
        connectionDetails: []
    };
}
