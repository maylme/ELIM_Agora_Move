package com.elim.polytech.projet;

import android.*;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Point;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.FragmentActivity;
import android.os.Bundle;
import android.support.v4.content.ContextCompat;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.widget.EditText;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.JsonArrayRequest;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;
import com.google.android.gms.maps.CameraUpdate;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.Polygon;
import com.google.android.gms.maps.model.PolygonOptions;
import com.google.android.gms.maps.model.Polyline;
import com.google.android.gms.maps.model.PolylineOptions;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class MapsActivity extends FragmentActivity implements OnMapReadyCallback {

    private GoogleMap mMap;
    private FloatingActionButton fab;
    private EditText from_date;
    private EditText from_time;
    private EditText to_date;
    private EditText to_time;
    private ArrayList<Integer> color;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_maps);

        int permissionCheck = ContextCompat.checkSelfPermission(this,
                android.Manifest.permission.ACCESS_FINE_LOCATION);
        if(permissionCheck != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,new String[]{android.Manifest.permission.ACCESS_FINE_LOCATION},0);
        }

        color = new ArrayList<>();
        color.add(Color.WHITE);
        color.add(Color.CYAN);
        color.add(Color.BLUE);
        color.add(Color.GREEN);
        color.add(Color.YELLOW);
        color.add(Color.RED);
        color.add(Color.LTGRAY);
        color.add(Color.GRAY);
        color.add(Color.DKGRAY);
        color.add(Color.BLACK);

        ////////////

        //////////
        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);
        //Intent intent = new Intent(this,GetLocation.class);
        //this.startService(intent);
        Alarm alarm = new Alarm();
        alarm.setAlarm(this);


        fab = (FloatingActionButton) this.findViewById(R.id.fab);

        from_date = (EditText) findViewById(R.id.from_date);
        from_time = (EditText) findViewById(R.id.from_time);
        to_date = (EditText) findViewById(R.id.to_date);
        to_time = (EditText) findViewById(R.id.to_time);
    }


    /**
     * Manipulates the map once available.
     * This callback is triggered when the map is ready to be used.
     * This is where we can add markers or lines, add listeners or move the camera. In this case,
     * we just add a marker near Sydney, Australia.
     * If Google Play services is not installed on the device, the user will be prompted to install
     * it inside the SupportMapFragment. This method will only be triggered once the user has
     * installed Google Play services and returned to the app.
     */
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        // Add a marker in Sydney and move the camera
        LatLng sophia = new LatLng(43.616865,7.072918 );
       // mMap.addMarker(new MarkerOptions().position(sydney).title("Marker in Sydney"));
        mMap.moveCamera(CameraUpdateFactory.newLatLng(sophia));
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(sophia,15));
        Log.i("TEST","1");

        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
              //  Log.i("#aaaAAAAA", "clic");
                mMap.clear();
                LatLng center = mMap.getCameraPosition().target;
              //  Log.i("###Position", mMap.getProjection().getVisibleRegion().latLngBounds.toString());

                LatLng northeast = mMap.getProjection().getVisibleRegion().latLngBounds.northeast;
                LatLng southweast = mMap.getProjection().getVisibleRegion().latLngBounds.southwest;

                LatLng northweast = new LatLng(northeast.latitude, southweast.longitude);
                LatLng southeast = new LatLng(southweast.latitude, northeast.longitude);

                // Instantiates a new Polyline object and adds points to define a rectangle
                PolylineOptions rectOptions = new PolylineOptions()
                        .add(northeast)
                        .add(northweast)
                        .add(southweast)
                        .add(southeast)
                        .add(northeast);

                // Get back the mutable Polyline
                Polyline polyline = mMap.addPolyline(rectOptions);
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd-HH-mm", Locale.FRANCE);
                try{
                    Date obj_from = sdf.parse(from_date.getText().toString()+"-"+from_time.getText().toString());
                    Date obj_to = sdf.parse(to_date.getText().toString()+"-"+to_time.getText().toString());
                    SimpleDateFormat res = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm'Z'", Locale.FRANCE);
                    String from = res.format(obj_from);
                    String to = res.format(obj_to);
                    editMap(from, to , northeast, southweast);
                }catch(Exception e){
                    alert(e.getMessage());
                }
            }
        });
    }

    private void alert(String e) {
        Log.i("#LOG ERR ", e);
    }
    private void editMap(String from, String to, LatLng northeast,LatLng southweast) throws Exception {

        // Request a string response from the provided URL.
        String url = "http://mayl.me:8081/data?from="+from+"&to="+to+"&lat1="+northeast.latitude+"&lat2="+southweast.latitude+"&lng1="+northeast.longitude+"&lng2="+southweast.longitude;
        Log.i("URL", url);
        JsonArrayRequest jsonRequest = new JsonArrayRequest(Request.Method.GET, url,null,
                new Response.Listener<JSONArray>() {
                    @Override
                    public void onResponse(JSONArray response) {
                        //mMap.clear();
                        // Display the first 500 characters of the response string.
                        Log.i("####REsponse", "got response json");
                        try{
                            //ArrayList<ArrayList<LatLng>> polygoneList = new ArrayList<>();
                            //ArrayList<Integer> polygoneSize = new ArrayList<>();
                            JSONArray array = response;
                            Log.i("RESPONSE JSON",array.toString());
                            for(int i = 0; i < array.length(); i++) {
                                //ArrayList<LatLng> clusterList = new ArrayList<>();
                                //JSONObject clusterObject = array.getJSONObject(i);
                                //polygoneSize.add(clusterObject.getInt("size"));
                                JSONObject polygon_obj = array.getJSONObject(i);
                                int size = (int) polygon_obj.get("size");
                                JSONArray polygons = polygon_obj.getJSONArray("polygon");
                                Log.i("POLYGONS IN CLUSTER", polygons.toString());
                                for (int j = 0; j < polygons.length(); j++){
                                    JSONArray polygon = polygons.getJSONArray(j);
                                    //init polygon on map :
                                    Log.i("POLYGON IN CLUSTER", polygon.toString());
                                    PolygonOptions polygon_map = new PolygonOptions();
                                    for (int k = 0; k < polygon.length(); k++) {
                                        JSONArray point_json = polygon.getJSONArray(k);
                                        LatLng point = new LatLng(point_json.getDouble(0), point_json.getDouble(1));
                                        polygon_map.add(point);
                                        Log.i("POINT IN POLYGON", point.toString());
                                    }
                                    polygon_map.fillColor(color.get(i));
                                    // Get back the mutable Polyline
                                    Polygon poly = mMap.addPolygon(polygon_map);
                                }
                            }

                        }

                        catch(org.json.JSONException error) {
                            Log.i("ERRRRRRORRR", error.toString());
                        }
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                Log.i("ERROR",error.toString());
            }
        });

        RequestQueue queue = Volley.newRequestQueue(this);
        queue.add(jsonRequest);

        /*String baseUrl = "http://mayl.me:8002/";
        StringBuilder result = new StringBuilder();
        URL url = new URL(baseUrl+ "?from="+from+"&to="+to+"&lat1="+northeast.latitude+"&lat2="+southweast.latitude+"&lng1="+northeast.longitude+"&lng2="+southweast.longitude);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        BufferedReader rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        String line;
        while ((line = rd.readLine()) != null) {
            result.append(line);
        }
        rd.close();
        return result.toString();*/
    }
}
