/*
 * Copyright @ 2017-present Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.jitsi.meet;

import org.jitsi.meet.sdk.JitsiMeetBaseActivity;


/**
 * The one and only Activity that Jitsi Meet (the app) needs. The activity is launched in
 * "singleTask" mode, so it will be created upon application initialization and there will be
 * a single instance of it. Further attempts at launching the application once it was already
 * launched will result in <tt>onNewIntent</tt> being called.
 *
 * This Activity inherits from JitsiMeetBaseActivity without adding anything to it. It merely exists to
 * keep the React Native CLI working, since it always tries to launch an activity called
 * "MainActivity" when doing "react-native run-android".
 */
public class MainActivity extends JitsiMeetBaseActivity {
}
