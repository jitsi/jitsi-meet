import React from 'react';

import Button from '../../../base/ui/components/native/Button';
import IconButton from '../../../base/ui/components/native/IconButton';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';

import { navigationStyles } from './styles';

type Props = {

    /**
     * Is the button disabled?
     */
    disabled?: boolean,

    /**
     * Label of the button.
     */
    label?: string,

    /**
     * Callback to invoke when the {@code HeaderNavigationButton} is clicked/pressed.
     */
    onPress?: Function,

    /**
     * The ImageSource to be rendered as image.
     */
    src?: Object,

    /**
     * Header has two actions.
     */
    twoActions?: boolean
}

const HeaderNavigationButton
    = ({
        disabled,
        label,
        onPress,
        src,
        twoActions
    }: Props) =>
        (
            <>
                {
                    src ? (
                        <IconButton
                            onPress = { onPress }
                            size = { 24 }
                            src = { src }
                            style = { navigationStyles.headerNavigationButtonIcon } />
                    ) : (
                        <Button
                            disabled = { disabled }
                            labelKey = { label }
                            labelStyle = {
                                twoActions
                                    ? navigationStyles.headerNavigationTextBold
                                    : navigationStyles.headerNavigationText
                            }
                            onClick = { onPress }
                            type = { BUTTON_TYPES.TERTIARY } />
                    )}
            </>
        );


export default HeaderNavigationButton;
