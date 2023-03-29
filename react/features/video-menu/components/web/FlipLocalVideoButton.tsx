import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { updateSettings } from '../../../base/settings/actions';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';

/**
 * The type of the React {@code Component} props of {@link FlipLocalVideoButton}.
 */
interface IProps extends WithTranslation {

    /**
     * The current local flip x status.
     */
    _localFlipX: boolean;

    /**
     * Button text class name.
     */
    className: string;

    /**
     * The redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Click handler executed aside from the main action.
     */
    onClick?: Function;
}

/**
 * Implements a React {@link Component} which displays a button for flipping the local viedo.
 *
 * @augments Component
 */
class FlipLocalVideoButton extends PureComponent<IProps> {
    /**
     * Initializes a new {@code FlipLocalVideoButton} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {null|ReactElement}
     */
    render() {
        const {
            className,
            t
        } = this.props;

        return (
            <ContextMenuItem
                accessibilityLabel = { t('videothumbnail.flip') }
                className = 'fliplink'
                id = 'flipLocalVideoButton'
                onClick = { this._onClick }
                text = { t('videothumbnail.flip') }
                textClassName = { className } />
        );
    }

    /**
     * Flips the local video.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const { _localFlipX, dispatch, onClick } = this.props;

        onClick?.();
        dispatch(updateSettings({
            localFlipX: !_localFlipX
        }));
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code FlipLocalVideoButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { localFlipX } = state['features/base/settings'];

    return {
        _localFlipX: Boolean(localFlipX)
    };
}

export default translate(connect(_mapStateToProps)(FlipLocalVideoButton));
