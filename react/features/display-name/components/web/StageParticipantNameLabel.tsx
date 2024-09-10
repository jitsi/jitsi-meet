import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { isDisplayNameVisible } from '../../../base/config/functions.any';
import {
    getLocalParticipant,
    getParticipantDisplayName,
    isWhiteboardParticipant
} from '../../../base/participants/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { getVideospaceFloatingElementsBottomSpacing } from '../../../base/ui/functions.web';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { getTransitionParamsForElementsAboveToolbox, isToolboxVisible } from '../../../toolbox/functions.web';
import { isLayoutTileView } from '../../../video-layout/functions.web';

import DisplayNameBadge from './DisplayNameBadge';
import {
    getStageParticipantFontSizeRange,
    getStageParticipantNameLabelLineHeight,
    getStageParticipantTypography,
    scaleFontProperty
} from './styles';

interface IOptions {
    clientHeight?: number;
}

const useStyles = makeStyles<IOptions>()((theme, options: IOptions = {}) => {
    const typography = {
        ...getStageParticipantTypography(theme)
    };
    const { clientHeight } = options;

    if (typeof clientHeight === 'number' && clientHeight > 0) {
        // We want to show the fontSize and lineHeight configured in theme on a screen with height 1080px. In this case
        // the clientHeight will be 960px if there are some titlebars, toolbars, addressbars, etc visible.For any other
        // screen size we will decrease/increase the font size based on the screen size.

        typography.fontSize = scaleFontProperty(clientHeight, getStageParticipantFontSizeRange(theme));
        typography.lineHeight = getStageParticipantNameLabelLineHeight(theme, clientHeight);
    }

    return {
        badgeContainer: {
            ...withPixelLineHeight(typography),
            alignItems: 'center',
            display: 'inline-flex',
            justifyContent: 'center',
            marginBottom: getVideospaceFloatingElementsBottomSpacing(theme, false),
            transition: `margin-bottom ${getTransitionParamsForElementsAboveToolbox(false)}`,
            pointerEvents: 'none',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            zIndex: 1
        },
        containerElevated: {
            marginBottom: getVideospaceFloatingElementsBottomSpacing(theme, true),
            transition: `margin-bottom ${getTransitionParamsForElementsAboveToolbox(true)}`
        }
    };
});

/**
 * Component that renders the dominant speaker's name as a badge above the toolbar in stage view.
 *
 * @returns {ReactElement|null}
 */
const StageParticipantNameLabel = () => {
    const clientHeight = useSelector((state: IReduxState) => state['features/base/responsive-ui'].clientHeight);
    const { classes, cx } = useStyles({ clientHeight });
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);
    const selectedId = largeVideoParticipant?.id;
    const nameToDisplay = useSelector((state: IReduxState) => getParticipantDisplayName(state, selectedId ?? ''));

    const localParticipant = useSelector(getLocalParticipant);
    const localId = localParticipant?.id;

    const isTileView = useSelector(isLayoutTileView);
    const toolboxVisible: boolean = useSelector(isToolboxVisible);
    const showDisplayName = useSelector(isDisplayNameVisible);

    if (showDisplayName
        && nameToDisplay
        && selectedId !== localId
        && !isTileView
        && !isWhiteboardParticipant(largeVideoParticipant)
    ) {
        return (
            <div
                className = { cx(
                    classes.badgeContainer,
                    toolboxVisible && classes.containerElevated
                ) }>
                <DisplayNameBadge name = { nameToDisplay } />
            </div>
        );
    }

    return null;
};

export default StageParticipantNameLabel;
