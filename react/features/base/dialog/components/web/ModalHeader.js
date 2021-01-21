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

    const Icon = appearance === 'danger' ? ErrorIcon : WarningIcon;

    return (
        <span css = { titleIconWrapperStyles(appearance) }>
            <Icon label = { `${appearance} icon` } />
        </span>
    );
};

/**
 * A default header for modal-dialog components
 *
 * @export
 * @class ModalHeader
 * @extends {React.Component<HeaderProps, {}>}
 */
export default class ModalHeader extends React.Component {
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
                <Icon
                    onClick = { onClose }
                    src = { IconClose } />
            </Header>
        );
    }
}
