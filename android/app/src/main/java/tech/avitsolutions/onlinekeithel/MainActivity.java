package tech.avitsolutions.onlinekeithel;

import android.content.Intent;
import android.os.Bundle;
import org.json.JSONObject;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private String pendingShare;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        captureShare(getIntent());
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        captureShare(intent);
        deliverShare();
    }

    @Override
    public void onResume() {
        super.onResume();
        deliverShare();
    }

    private void captureShare(Intent intent) {
        if (intent != null && Intent.ACTION_SEND.equals(intent.getAction()) && "text/plain".equals(intent.getType())) {
            pendingShare = intent.getStringExtra(Intent.EXTRA_TEXT);
        }
    }

    private void deliverShare() {
        if (pendingShare == null || bridge == null || bridge.getWebView() == null) return;
        bridge.getWebView().post(new Runnable() {
            private int attempts = 0;

            @Override
            public void run() {
                if (bridge == null || bridge.getWebView() == null || pendingShare == null) return;
                String page = bridge.getWebView().getUrl();
                if (page != null && (page.startsWith("http://localhost/") || page.startsWith("https://localhost/"))) {
                    String text = pendingShare;
                    pendingShare = null;
                    bridge.getWebView().evaluateJavascript(
                        "window.location.assign('/share?text=' + encodeURIComponent(" + JSONObject.quote(text) + "))", null);
                } else if (++attempts < 40) {
                    bridge.getWebView().postDelayed(this, 250);
                }
            }
        });
    }
}
