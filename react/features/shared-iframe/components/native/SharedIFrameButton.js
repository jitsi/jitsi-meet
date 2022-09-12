import { translate } from '../../../base/i18n';
import { IconShareIFrame } from '../../../base/icons';
import { connect } from '../../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../../base/toolbox/components';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { toggleSharedIFrame } from '../../actions';
import { getSharedIFrameInstances, getSharedIFramesInfo } from '../../functions';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    // dispatch: Dispatch<any>,

    /**
     * Whether or not the button is disabled.
     */
    _isDisabled: boolean,

    /**
     * Whether or not the local participant is sharing an iframe.
     */
    _isSharingIFrame: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The Key of the sharedIFrame Config for this button.
     */
    shareKey: String,

    /**
     * The title of the sharedIframe.
     */
    shareTitle: String
};

/**
 * Implements an {@link AbstractButton} to open the user documentation in a new window.
 */
class SharedIFrameButton extends AbstractButton<Props, *> {
    accessibilityLabel = this.props.t('toolbar.accessibilityLabel.sharediframe', {
        iframename: this.props.shareTitle
    });
    icon = IconShareIFrame;
    label = this.props.t('toolbar.sharediframe', {
        iframename: this.props.shareTitle
    });
    toggledLabel = this.props.t('toolbar.stopSharedIFrame', {
        iframename: this.props.shareTitle
    });

    /**
     * Dynamically retrieves tooltip based on sharing state.
     */
    get tooltip() {
        if (this._isDisabled()) {
            return this.props.t('toolbar.disabledSharedIFrame', {
                iframename: this.props.shareTitle
            });
        }
        if (this._isToggled()) {
            return this.props.t('toolbar.stopSharedIFrame', {
                iframename: this.props.shareTitle
            });
        }

        return this.props.t('toolbar.sharediframe', {
            iframename: this.props.shareTitle
        });
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The icon value.
     */
    set tooltip(_value) {
        // Unused.
    }

    /**
     * Handles clicking / pressing the button, and opens a new dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { _isSharingIFrame, _templateUrl, dispatch, shareKey } = this.props;

        if (!_isSharingIFrame) {
            navigate(screen.conference.sharedIFrame, { templateUrl: _templateUrl });
        }
        dispatch(toggleSharedIFrame(shareKey));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isSharingIFrame;
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._isDisabled;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The Props.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const sharedIFrames = getSharedIFramesInfo(state);

    return {
        _isDisabled: sharedIFrames[ownProps.shareKey]?.disabled || false,
        _isSharingIFrame: sharedIFrames[ownProps.shareKey]?.isSharing || false,
        _templateUrl: getSharedIFrameInstances(state)[ownProps.shareKey]?.templateUrl
    };
}


export default translate(connect(_mapStateToProps)(SharedIFrameButton));
