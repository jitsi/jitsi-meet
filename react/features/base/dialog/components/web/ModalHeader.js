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
import React from 'react';

import { translate } from '../../../i18n';
import { Icon, IconClose } from '../../../icons';

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
    heading: string,
    hideCloseIconButton: boolean,
    onClose: Function,
    showKeyline: boolean,
    isHeadingMultiline: boolean,
    testId: string,
    t: Function
}

/**
 * A default header for modal-dialog components
 *
 * @export
 * @class ModalHeader
 * @extends {React.Component<Props>}
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
            <Header showKeyline = { showKeyline }>
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
                    !hideCloseIconButton && <Icon
                        ariaLabel = { t('dialog.close') }
                        onClick = { onClose }
                        onKeyPress = { this._onKeyPress }
                        role = 'button'
                        src = { IconClose }
                        tabIndex = { 0 } />
                }
            </Header>
        );
    }
}
export default translate(ModalHeader);
