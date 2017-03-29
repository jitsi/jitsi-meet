/* @flow */

import { shallow } from 'enzyme';
import React from 'react';

import { CHROME, CHROMIUM, FIREFOX } from '../browserLinks';
import PluginRequiredBrowser from '../PluginRequiredBrowser';

declare var describe: Function;
declare var expect: Function;
declare var it: Function;

/**
 * Test suite related to PluginRequiredBrowser component.
 */
describe('PluginRequiredBrowser component', () => {

    /**
     * Checks whether component renders links to WebRTC capable browsers.
     */
    it('should render links to download WebRTC-capable browsers', () => {
        const wrapper = shallow(<PluginRequiredBrowser />);
        const links = wrapper.find('.unsupported-desktop-browser__link');

        expect(links).toHaveLength(3);
        expect(links.find(`[href="${CHROME}"]`)).toHaveLength(1);
        expect(links.find(`[href="${CHROMIUM}"]`)).toHaveLength(1);
        expect(links.find(`[href="${FIREFOX}"]`)).toHaveLength(1);
    });
});
