// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';
import { useSelector } from 'react-redux';

import { isDisplayNameVisible, isNameReadOnly } from '../../../base/config/functions.any';
import DisplayName from '../../../display-name/components/web/DisplayName';
import { LAYOUTS } from '../../../video-layout';

import StatusIndicators from './StatusIndicators';

declare var interfaceConfig: Object;

type Props = {

    /**
     * The current layout of the filmstrip.
     */
    currentLayout: string,

    /**
     * Class name for indicators container.
     */
    className: string,

    /**
     * Whether or not the indicators are for the local participant.
     */
    local: boolean,

    /**
     * Id of the participant for which the component is displayed.
     */
    participantId: string
}

const useStyles = makeStyles(() => {
    return {
        nameContainer: {
            display: 'flex',
            overflow: 'hidden',
            padding: '2px 0',

            '&>div': {
                display: 'flex',
                overflow: 'hidden'
            },

            '&:first-child': {
                marginLeft: '6px'
            }
        }
    };
});

const ThumbnailBottomIndicators = ({
    className,
    currentLayout,
    local,
    participantId
}: Props) => {
    const styles = useStyles();
    const _allowEditing = !useSelector(isNameReadOnly);
    const _defaultLocalDisplayName = interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME;
    const _showDisplayName = useSelector(isDisplayNameVisible);

    return (<div className = { className }>
        <StatusIndicators
            audio = { true }
            moderator = { true }
            participantID = { participantId }
            screenshare = { currentLayout === LAYOUTS.TILE_VIEW } />
        {
            _showDisplayName && (
                <span className = { styles.nameContainer }>
                    <DisplayName
                        allowEditing = { local ? _allowEditing : false }
                        currentLayout = { currentLayout }
                        displayNameSuffix = { local ? _defaultLocalDisplayName : '' }
                        elementID = { local ? 'localDisplayName' : `participant_${participantId}_name` }
                        participantID = { participantId } />
                </span>
            )
        }
    </div>);
};

export default ThumbnailBottomIndicators;
