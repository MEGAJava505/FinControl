package com.fincontrol.app;

import android.content.Intent;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

public class NotificationReceiverService extends NotificationListenerService {

    private static final String TAG = "FinControlNotifService";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();
        String title = sbn.getNotification().extras.getString("android.title");
        String text = sbn.getNotification().extras.getString("android.text");
        
        boolean isBankShortcode = title != null && (title.contains("2500") || title.contains("13131") || title.contains("1313") || title.contains("9000") || title.contains("5100"));

        // Listen only to explicit banking/finance apps, messaging apps, or explicit shortcodes
        if (isBankShortcode ||
            packageName.contains("payme") || 
            packageName.contains("click") || 
            packageName.contains("uzum") || 
            packageName.contains("apelsin") || 
            packageName.contains("kapitalbank") || 
            packageName.contains("ofb") || 
            packageName.contains("bank") ||
            packageName.contains("sms") ||
            packageName.contains("mms") ||
            packageName.contains("messaging") ||
            packageName.contains("message") ||
            packageName.contains("telegram")) {

            Log.d(TAG, "Received Push from " + packageName + ": " + text);

            if (text != null) {
                Intent intent = new Intent("com.fincontrol.NOTIFICATION_RECEIVED");
                intent.putExtra("package", packageName);
                intent.putExtra("title", title != null ? title : "");
                intent.putExtra("text", text);
                sendBroadcast(intent);
            }
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Ignored
    }
}
