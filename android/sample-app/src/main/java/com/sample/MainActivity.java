package com.sample;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;
import java.net.URL;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            JitsiMeetConferenceOptions options = new JitsiMeetConferenceOptions.Builder()
                .setServerURL(new URL("https://meet.jit.si"))
                .setRoom("TestRoom12345")
                .build();
            
            // JitsiMeetActivity.launch(this, options);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
