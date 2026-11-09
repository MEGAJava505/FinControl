package com.fincontrol.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import androidx.core.content.ContextCompat;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationMonitor")
public class NotificationMonitorPlugin extends Plugin {

    private BroadcastReceiver receiver;

    @Override
    public void load() {
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if ("com.fincontrol.NOTIFICATION_RECEIVED".equals(intent.getAction())) {
                    JSObject data = new JSObject();
                    data.put("package", intent.getStringExtra("package"));
                    data.put("title", intent.getStringExtra("title"));
                    data.put("text", intent.getStringExtra("text"));

                    Log.d("NotificationMonitor", "Passing to JS: " + data.toString());
                    
                    notifyListeners("onNotification", data);
                }
            }
        };
        
        IntentFilter filter = new IntentFilter("com.fincontrol.NOTIFICATION_RECEIVED");
        ContextCompat.registerReceiver(getContext(), receiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        Context ctx = getContext();
        String enabledListeners = Settings.Secure.getString(ctx.getContentResolver(), "enabled_notification_listeners");
        boolean hasPermission = enabledListeners != null && enabledListeners.contains(ctx.getPackageName());
        
        JSObject ret = new JSObject();
        ret.put("hasPermission", hasPermission);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        try {
            Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Cannot open settings: " + e.getMessage());
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (receiver != null) {
            getContext().unregisterReceiver(receiver);
        }
        super.handleOnDestroy();
    }
}
