// @flow
/* eslint-disable react/no-multi-comp */
import ErrorIcon from '@atlaskit/icon/glyph/error';
import WarningIcon from '@atlaskit/icon/glyph/warning';
import {
    Header,
    Title,
    titleIconWrapperStyles,
    TitleText
} from '@atlaskit/modal-dialog/dist/es2019/styled/Content';
import { withStyles } from '@material-ui/core/styles';
import React from 'react';

import { translate } from '../../../i18n';
import { Icon, IconClose } from '../../../icons';
import { withPixelLineHeight } from '../../../styles/functions';

const TitleIcon = ({ appearance }: { appearance?: 'danger' | 'warning' }) => {
    if (!appearance) {
        return null;
    }

    const IconSymbol = appearance === 'danger' ? ErrorIcon : WarningIcon;

    return (
        <span css = { titleIconWrapperStyles(appearance) }>
            <IconSymbol label = { `${appearance} icon` } />
        </span>
    );
};

type Props = {
    id: string,
    appearance?: 'danger' | 'warning',
    classes: Object,
    heading: string,
    hideCloseIconButton: boolean,
    onClose: Function,
    showKeyline: boolean,
    isHeadingMultiline: boolean,
    testId: string,
    t: Function
}

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    return {
        closeButton: {
            borderRadius: theme.shape.borderRadius,
            cursor: 'pointer',
            padding: 13,

            [theme.breakpoints.down('480')]: {
                background: theme.palette.action02
            },

            '&:hover': {
                background: theme.palette.action02
            }
        },
        header: {
            boxShadow: 'none',

            '& h4': {
                ...withPixelLineHeight(theme.typography.heading5),
                color: theme.palette.text01
            }
        }
    };
};


/**
 * A default header for modal-dialog components.
 *
 * @class ModalHeader
 * @augments {React.Component<Props>}
 */
class ModalHeader extends React.Component<Props> {
    static defaultProps = {
        isHeadingMultiline: true
    };

    /**
     * Initializes a new {@code ModalHeader} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onKeyPress = this._onKeyPress.bind(this);
    }

    _onKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e) {
        if (this.props.onClose && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            this.props.onClose();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            id,
            appearance,
            classes,
            heading,
            hideCloseIconButton,
            onClose,
            showKeyline,
            isHeadingMultiline,
            testId,
            t
        } = this.props;

        if (!heading) {
            return null;
        }

        return (
            <Header
                className = { classes.header }
                showKeyline = { showKeyline }>
                <Title>
                    <TitleIcon appearance = { appearance } />
                    <TitleText
                        data-testid = { testId && `${testId}-heading` }
                        id = { id }
                        isHeadingMultiline = { isHeadingMultiline }>
                        {heading}
                    </TitleText>
                </Title>

                {
                    !hideCloseIconButton
                        && <div
                            className = { classes.closeButton }
                            id = 'modal-header-close-button'
                            onClick = { onClose }>
                            <Icon
                                ariaLabel = { t('dialog.close') }
                                onKeyPress = { this._onKeyPress }
                                role = 'button'
                                src = { IconClose }
                                tabIndex = { 0 } />
                        </div>
                }
            </Header>
        );
    }
}
export default translate(withStyles(styles)(ModalHeader));
