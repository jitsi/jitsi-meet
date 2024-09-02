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
import { getStageParticipantTypography } from './styles';

const useStyles = makeStyles()(theme => {
    return {
        badgeContainer: {
            ...withPixelLineHeight(getStageParticipantTypography(theme)),
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
    const { classes, cx } = useStyles();
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
                    'stage-participant-label',
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
