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
export default class ModalHeader extends React.Component<Props> {
    static defaultProps = {
        isHeadingMultiline: true
    };

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
            testId
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
                        onClick = { onClose }
                        src = { IconClose } />
                }
            </Header>
        );
    }
}
