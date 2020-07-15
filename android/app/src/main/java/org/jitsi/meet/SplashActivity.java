package org.postech.vmeeting;

import android.content.Intent;
import android.os.Bundle;

import org.jitsi.meet.sdk.JitsiMeetActivity;

public class SplashActivity extends JitsiMeetActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = new Intent(this, org.postech.vmeeting.MainActivity.class);
        startActivity(intent);

        finish();
    }
}