package com.elim.polytech.projet;

import android.*;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import android.os.IBinder;
import android.support.annotation.Nullable;
import android.support.v4.content.ContextCompat;
import android.util.Log;
import android.widget.Toast;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.JsonRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;
import org.json.JSONObject;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Created by Rhoo on 16/02/2017.
 */

public class GetLocation extends Service {

    Double lon;
    Double lat;
    LocationManager locationManager;
    Location GPSLocation;
    Location NetworkLocation;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i("LAUNCH"," GET LOCATION");
        int permissionCheck = ContextCompat.checkSelfPermission(this,
                android.Manifest.permission.ACCESS_FINE_LOCATION);
        locationManager = (LocationManager) this.getSystemService(Context.LOCATION_SERVICE);
        GPSLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
        NetworkLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
        if (GPSLocation != null) {
            lon = GPSLocation.getLongitude();
            lat = GPSLocation.getLatitude();
            Log.i("LOCATION GPS:", "LAT: " + lon + "LON: " + lat);
        } else {
            lon = NetworkLocation.getLongitude();
            lat = NetworkLocation.getLatitude();
            Log.i("LOCATION NETWORK:", "LAT: " + lon + "LON: " + lat);
        }
        String url = "http://mayl.me:8081/data";
        JSONObject request = null;
        try {
            request = new JSONObject();
            DateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm'Z'", Locale.FRANCE);
            request.put("time", df.format(new Date()));
            JSONObject position = new JSONObject();
            position.put("longitude", lon);
            position.put("latitude", lat);
            request.put("position", position);
        } catch (JSONException error) {
            Log.e("JSON POST ERROR: ", error.toString());
        }
        JsonRequest postRequest = new JsonObjectRequest(Request.Method.POST, url, request,
                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {
                        // response
                        Log.i("POST REPONSE", response.toString());
                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        // error
                        Log.d("Error.Response", error.toString());
                    }
                }
        );
        RequestQueue queue = Volley.newRequestQueue(this);
        queue.add(postRequest);
        return START_STICKY;
    }

    @Override
    public void onCreate() {

    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}