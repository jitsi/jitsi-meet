// @flow

const LEFT_RIGHT_OFFSET = 25;
const TOP_BOTTOM_OFFSET = 20;

const getLeftAlignedStyle = bounds => {
    return {
        position: 'fixed',
        right: `${window.innerWidth - bounds.x + LEFT_RIGHT_OFFSET}px`
    };
};

const getRightAlignedStyle = bounds => {
    return {
        position: 'fixed',
        left: `${bounds.x + bounds.width + LEFT_RIGHT_OFFSET}px`
    };
};

const getTopAlignedStyle = bounds => {
    return {
        position: 'fixed',
        bottom: `${window.innerHeight - bounds.y + TOP_BOTTOM_OFFSET}px`
    };
};

const getBottomAlignedStyle = bounds => {
    return {
        position: 'fixed',
        top: `${bounds.y + bounds.height + TOP_BOTTOM_OFFSET}px`
    };
};

const getLeftRightStartAlign = (bounds, size) => {
    return {
        top: `${Math.min(bounds.y + 15, window.innerHeight - size.height - 20)}px`
    };
};

const getLeftRightMidAlign = (bounds, size) => {
    return {
        bottom: `${window.innerHeight - bounds.y - bounds.height - (size.height / 2)}px`
    };
};

const getLeftRightEndAlign = (bounds, size) => {
    return {
        bottom: `${Math.min(window.innerHeight - bounds.y - bounds.height, window.innerHeight - size.height)}px`
    };
};

const getTopBotStartAlign = bounds => {
    return {
        right: `${window.innerWidth - bounds.x + 10}px`
    };
};

const getTopBotMidAlign = (bounds, size) => {
    return {
        right: `${window.innerWidth - bounds.x - (size.width / 2)}px`
    };
};

const getTopBotEndAlign = bounds => {
    return {
        left: `${bounds.x + bounds.width + 10}px`
    };
};

/**
 * Gets the trigger element's and the context menu's bounds/size info and
 * computes the style to apply to the context menu to positioning it correctly
 * in regards to the given position info.
 *
 * @param {DOMRect} triggerBounds -The bounds info of the trigger html element.
 * @param {DOMRectReadOnly} dialogSize - The size info of the context menu.
 * @param {string} position - The position of the context menu in regards to the trigger element.
 *
 * @returns {Object} = The style to apply to context menu for positioning it correctly.
 */
export const getContextMenuStyle = (triggerBounds: DOMRect,
        dialogSize: DOMRectReadOnly,
        position: string) => {
    const parsed = position.split('-');

    switch (parsed[0]) {
    case 'top': {
        let alignmentStyle = {};

        if (parsed[1]) {
            alignmentStyle = parsed[1] === 'start'
                ? getTopBotStartAlign(triggerBounds)
                : getTopBotEndAlign(triggerBounds);
        } else {
            alignmentStyle = getTopBotMidAlign(triggerBounds, dialogSize);
        }

        return {
            ...getTopAlignedStyle(triggerBounds),
            ...alignmentStyle
        };
    }
    case 'bottom': {
        let alignmentStyle = {};

        if (parsed[1]) {
            alignmentStyle = parsed[1] === 'start'
                ? getTopBotStartAlign(triggerBounds)
                : getTopBotEndAlign(triggerBounds);
        } else {
            alignmentStyle = getTopBotMidAlign(triggerBounds, dialogSize);
        }

        return {
            ...getBottomAlignedStyle(triggerBounds),
            ...alignmentStyle
        };
    }
    case 'left': {
        let alignmentStyle = {};

        if (parsed[1]) {
            alignmentStyle = parsed[1] === 'start'
                ? getLeftRightStartAlign(triggerBounds, dialogSize)
                : getLeftRightEndAlign(triggerBounds, dialogSize);
        } else {
            alignmentStyle = getLeftRightMidAlign(triggerBounds, dialogSize);
        }

        return {
            ...getLeftAlignedStyle(triggerBounds),
            ...alignmentStyle
        };
    }
    case 'right': {
        let alignmentStyle = {};

        if (parsed[1]) {
            alignmentStyle = parsed[1] === 'start'
                ? getLeftRightStartAlign(triggerBounds, dialogSize)
                : getLeftRightEndAlign(triggerBounds, dialogSize);
        } else {
            alignmentStyle = getLeftRightMidAlign(triggerBounds, dialogSize);
        }

        return {
            ...getRightAlignedStyle(triggerBounds),
            ...alignmentStyle
        };
    }
    default: {
        return {
            ...getLeftAlignedStyle(triggerBounds),
            ...getLeftRightEndAlign(triggerBounds, dialogSize)
        };
    }
    }
};
