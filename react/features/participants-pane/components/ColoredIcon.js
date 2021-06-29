// @flow

import { makeStyles } from '@material-ui/core/styles';
import React, { type Node } from 'react';

import { Icon } from '../../base/icons';
import { MEDIA_STATE, type MediaState } from '../constants';

type Props = {

    /**
     * The icon to be used.
     */
    src: Node,

    /**
     * The media state for the icon.
     */
    type: MediaState
}

const stateMap = {
    [MEDIA_STATE.UNMUTED]: 'success01',
    [MEDIA_STATE.FORCE_MUTED]: 'iconError'
};

const useStyles = makeStyles(theme => {
    return {
        icon: props => {
            return {
                '& > div > svg': {
                    fill: theme.palette[stateMap[props.type]]
                }
            };
        }
    };
});

export default (props: Props) => {
    const classes = useStyles(props);

    return (
        <div className = { classes.icon }>
            <Icon
                size = { 16 }
                src = { props.src } />
        </div>
    );
};
