import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconPlus } from '../../base/icons/svg';
import Tooltip from '../../base/tooltip/components/Tooltip';

/**
 * The type of the React {@code Component} props of {@link JoinButton}.
 */
interface IProps extends WithTranslation {

    /**
     * The function called when the button is pressed.
     */
    onPress: Function;

    /**
     * The meeting URL associated with the {@link JoinButton} instance.
     */
    url: string;
}

/**
 * A React Component for joining an existing calendar meeting.
 *
 * @augments Component
 */
class JoinButton extends Component<IProps> {

    /**
     * Initializes a new {@code JoinButton} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onClick = this._onClick.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const { t } = this.props;

        return (
            <Tooltip
                content = { t('calendarSync.joinTooltip') }>
                <div
                    className = 'button join-button'
                    onClick = { this._onClick }
                    onKeyPress = { this._onKeyPress }
                    role = 'button'>
                    <Icon
                        size = '14'
                        src = { IconPlus } />
                </div>
            </Tooltip>
        );
    }

    /**
     * Callback invoked when the component is clicked.
     *
     * @param {Object} event - The DOM click event.
     * @private
     * @returns {void}
     */
    _onClick(event?: React.MouseEvent) {
        this.props.onPress(event, this.props.url);
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e: React.KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onClick();
        }
    }
}

export default translate(JoinButton);
