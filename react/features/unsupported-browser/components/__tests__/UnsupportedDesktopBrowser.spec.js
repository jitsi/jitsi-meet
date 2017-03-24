/* @flow */

import { shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';

import { Platform } from '../../../base/react';

import { CHROME, FIREFOX, IE, SAFARI } from '../browserLinks';
import HideNotificationBarStyle from '../HideNotificationBarStyle';
import { UnsupportedDesktopBrowser } from '../UnsupportedDesktopBrowser';

declare var afterAll: Function;
declare var beforeAll: Function;
declare var describe: Function;
declare var expect: Function;
declare var it: Function;

let sandbox;

describe('UnsupportedDesktopBrowser component', () => {

    /**
     * Creates sandbox for stubbing methods and properties.
     */
    beforeAll(() => {
        sandbox = sinon.sandbox.create();
    });

    /**
     * Restores created stubs.
     */
    afterAll(() => {
        sandbox.restore();
    });

    /**
     * UnsupportedDesktopBrowser should render component containing styles
     * hiding notification bar from lib-jitsi-meet.
     */
    it('should render HideNotificationBarStyle', () => {
        const wrapper = shallow(<UnsupportedDesktopBrowser />);

        expect(wrapper.find(HideNotificationBarStyle)).toHaveLength(1);
    });

    /**
     * Checks UnsupportedDesktopBrowser to show download links to WebRTC
     * capable browsers.
     */
    it('should render links to Chrome and Firefox for all cases', () => {
        // Sets platform to undefined in order to neglect by platform specific
        // browsers.
        sandbox.stub(Platform, 'OS', undefined);
        const wrapper = shallow(<UnsupportedDesktopBrowser />);
        const links = wrapper.find('.unsupported-desktop-browser__link');

        expect(links).toHaveLength(2);
        expect(links.filter(`[href="${CHROME}"]`)).toHaveLength(1);
        expect(links.filter(`[href="${FIREFOX}"]`)).toHaveLength(1);

    });

    /**
     * Checks UnsupportedDesktop browser to render links to platform specific
     * browsers.
     */
    it('should render links to platform specific browsers', () => {
        sandbox.stub(Platform, 'OS', 'macos');
        let wrapper = shallow(<UnsupportedDesktopBrowser />);
        let link = wrapper
            .find('.unsupported-desktop-browser__link')
            .filter(`[href="${SAFARI}"]`);

        expect(link).toHaveLength(1);

        sandbox.stub(Platform, 'OS', 'windows');
        wrapper = shallow(<UnsupportedDesktopBrowser />);
        link = wrapper
            .find('.unsupported-desktop-browser__link')
            .filter(`[href="${IE}"]`);

        expect(link).toHaveLength(1);
    });
});
