package tech.avitsolutions.onlinekeithel;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private volatile String pendingShare;
    private volatile boolean shareReady = true;
    private final ExecutorService shareExecutor = Executors.newSingleThreadExecutor();
    private static final int MAX_SHARED_IMAGE_BYTES = 8 * 1024 * 1024;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        captureShare(getIntent());
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        captureShare(intent);
        deliverShare();
    }

    @Override
    public void onResume() {
        super.onResume();
        deliverShare();
    }

    private void captureShare(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        String title = intent.getStringExtra(Intent.EXTRA_TITLE);
        Uri imageUri = null;
        imageUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (imageUri == null && intent.getClipData() != null && intent.getClipData().getItemCount() > 0) {
            Uri candidate = intent.getClipData().getItemAt(0).getUri();
            if (candidate != null && "content".equals(candidate.getScheme())) imageUri = candidate;
        }
        if (text == null && imageUri == null) return;
        JSONObject payload = new JSONObject();
        try { payload.put("text", text == null ? "" : text); } catch (Exception ignored) {}
        try { payload.put("title", title == null ? "" : title); } catch (Exception ignored) {}
        pendingShare = payload.toString();
        shareReady = imageUri == null;
        if (imageUri != null) {
            final Uri sharedImage = imageUri;
            shareExecutor.execute(() -> {
                try {
                    String mime = getContentResolver().getType(sharedImage);
                    if (mime == null || !mime.startsWith("image/")) mime = "image/png";
                    try (InputStream input = getContentResolver().openInputStream(sharedImage);
                         ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                        if (input != null) {
                            byte[] buffer = new byte[8192];
                            int total = 0;
                            int read;
                            while ((read = input.read(buffer)) != -1 && total <= MAX_SHARED_IMAGE_BYTES) {
                                output.write(buffer, 0, read);
                                total += read;
                            }
                            if (total <= MAX_SHARED_IMAGE_BYTES) {
                                payload.put("mediaData", "data:" + mime + ";base64," + Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP));
                            }
                        }
                    }
                } catch (Exception ignored) { /* Keep the shared link and let the seller choose the photo in the form. */ }
                pendingShare = payload.toString();
                shareReady = true;
                runOnUiThread(this::deliverShare);
            });
        }
    }

    private void deliverShare() {
        if (pendingShare == null || !shareReady || bridge == null || bridge.getWebView() == null) return;
        bridge.getWebView().post(new Runnable() {
            private int attempts = 0;

            @Override
            public void run() {
                if (bridge == null || bridge.getWebView() == null || pendingShare == null || !shareReady) return;
                String page = bridge.getWebView().getUrl();
                if (page != null && (page.startsWith("http://localhost/") || page.startsWith("https://localhost/"))) {
                    String payload = pendingShare;
                    pendingShare = null;
                    bridge.getWebView().evaluateJavascript(
                        "(function(){var p=" + payload + ";window.__OO_PENDING_SHARE=p;var q=new URLSearchParams();if(p.text)q.set('text',p.text);if(p.title)q.set('title',p.title);if(p.mediaData)q.set('hasMedia','1');history.pushState({},'', '/share'+(q.toString()?'?'+q.toString():''));window.dispatchEvent(new PopStateEvent('popstate'));})()",
                        null);
                } else if (++attempts < 40) {
                    bridge.getWebView().postDelayed(this, 250);
                }
            }
        });
    }
}
