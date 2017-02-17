package com.elim.polytech.projet;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Created by Rhoo on 16/02/2017.
 */

public class MyBroadCastReceiver extends BroadcastReceiver {

    Alarm alarm = new Alarm();

    @Override
    public void onReceive(Context context, Intent intent) {
        alarm.setAlarm(context);
    }
}
