// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';

import ParticipantPaneBaseButton from './ParticipantPaneBaseButton';

type Props = {

    /**
     * Label used for accessibility.
     */
    accessibilityLabel: String,

    /**
     * Children of the component.
     */
    children: string | React$Node,

    /**
     * Button id.
     */
    id?: string,

    /**
     * Whether or not the button is icon button (no text).
     */
    isIconButton?: boolean,

    /**
     * Click handler.
     */
    onClick: Function
}

const useStyles = makeStyles(theme => {
    return {
        button: {
            padding: `${theme.spacing(2)}px`
        }
    };
});

const FooterButton = ({ accessibilityLabel, children, id, isIconButton = false, onClick }: Props) => {
    const styles = useStyles();

    return (<ParticipantPaneBaseButton
        accessibilityLabel = { accessibilityLabel }
        className = { isIconButton ? styles.button : '' }
        id = { id }
        onClick = { onClick }>
        {children}
    </ParticipantPaneBaseButton>
    );
};

export default FooterButton;
