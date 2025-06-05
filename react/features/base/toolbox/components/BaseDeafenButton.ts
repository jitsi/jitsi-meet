import { IconVolumeOff, IconVolumeUp } from "../../icons/svg";
import AbstractButton, { IProps } from "./AbstractButton";

/**
 * An abstract implementation of a button for toggling audio deafen.
 */
export default class BaseDeafenButton<P extends IProps, S=any> extends AbstractButton<P, S> {

  override icon = IconVolumeUp;
  override toggledIcon = IconVolumeOff;

  /**
     * Handles clicking / pressing the button, and toggles the deaf state
     * accordingly.
     *
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        this._setDeafened(!this._isDeafened());
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this._isDeafened();
    }

    /**
     * Helper function to be implemented by subclasses, which must return a
     * {@code boolean} value indicating if the user is currently deafened or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isDeafened() {
        // To be implemented by subclass.
        return false;
    }

    /**
     * Helper function to perform the actual setting of the deafened state.
     *
     * @param {boolean} _deafened - Whether the user should be deafened or not.
     * @protected
     * @returns {void}
     */
    _setDeafened(_deafened: boolean) {
        // To be implemented by subclass.
    }
}
