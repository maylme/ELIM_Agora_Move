package com.example.rhoo.pas;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.util.Log;

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
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Created by Rhoo on 18/12/2016.
 */

public class GetLocation extends Activity{
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        int permissionCheck = ContextCompat.checkSelfPermission(this,
                Manifest.permission.ACCESS_FINE_LOCATION);
        if (permissionCheck != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 0);
        }
        LocationManager locationManager = (LocationManager) this.getSystemService(Context.LOCATION_SERVICE);
        Location GPSLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
        Location NetworkLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
        Double lon;
        Double lat;
        if (GPSLocation != null) {
            lon = GPSLocation.getLongitude();
            lat = GPSLocation.getLatitude();
            Log.i("LOCATION GPS:", "LAT: " + lon + "LON: " + lat);
        }
        else {
            lon = NetworkLocation.getLongitude();
            lat = NetworkLocation.getLatitude();
            Log.i("LOCATION NETWORK:", "LAT: " + lon + "LON: " + lat);
        }
            String url = "http://192.168.1.12:8081/data";
            JSONObject request = null;
            try {
                request = new JSONObject();
                DateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm'Z'", Locale.FRANCE);
                request.put("time", df.format(new Date()));
                JSONObject position = new JSONObject();
                position.put("longitude", lon);
                position.put("latitude", lat);
                request.put("position",position);
            }
            catch (JSONException error) {
                Log.e("JSON POST ERROR: ", error.toString());
            }
            JsonRequest postRequest = new JsonObjectRequest(Request.Method.POST ,url, request,
                    new Response.Listener<JSONObject>()
                    {
                        @Override
                        public void onResponse(JSONObject response) {
                            // response
                            Log.i("POST REPONSE", response.toString());
                        }
                    },
                    new Response.ErrorListener()
                    {
                        @Override
                        public void onErrorResponse(VolleyError error) {
                            // error
                            Log.d("Error.Response", error.toString());
                        }
                    }
            );
            RequestQueue queue = Volley.newRequestQueue(this);
            queue.add(postRequest);
    }
}
