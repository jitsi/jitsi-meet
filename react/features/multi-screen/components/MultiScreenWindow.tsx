import React from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';

import { getSecondaryWindow } from '../actions';
import { SECONDARY_WINDOW_ROOT_ID } from '../constants';
import { isMultiScreenActive } from '../functions';

import SecondaryConference from './SecondaryConference';

// Side-effect import: style-loader injects these rules into the main document's
// <head>, which copyStylesToWindow() then copies into the secondary window.
import '../multi-screen.css';

/**
 * Component that bridges the main React tree to the secondary browser window
 * via React's createPortal(). This allows the SecondaryConference to render
 * into the secondary window's DOM while sharing the same Redux store, React
 * context, and WebRTC tracks as the main window.
 *
 * @returns {React.ReactPortal | null}
 */
const MultiScreenWindow: React.FC = () => {
    const isActive = useSelector(isMultiScreenActive);

    if (!isActive) {
        return null;
    }

    const secondaryWindow = getSecondaryWindow();

    // The user may have closed the window externally before Redux flips
    // isActive to false; reading .document on a closed window can throw or
    // behave inconsistently across browsers, so bail out on a missing or
    // already-closed window first.
    if (!secondaryWindow || secondaryWindow.closed) {
        return null;
    }

    const rootElement = secondaryWindow.document?.getElementById(SECONDARY_WINDOW_ROOT_ID);

    if (!rootElement) {
        return null;
    }

    // createPortal renders SecondaryConference into the secondary window's DOM
    // but keeps it in the same React tree — Redux access is automatic.
    return createPortal(<SecondaryConference />, rootElement);
};

export default MultiScreenWindow;
