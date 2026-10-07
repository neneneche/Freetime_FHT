package com.freetime.service;

import com.freetime.model.Event;
import com.freetime.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeocodingService {

    private final EventRepository eventRepository;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private static final Pattern LAT_PATTERN = Pattern.compile("\"lat\":\\s*\"?([\\d.]+)\"?");
    private static final Pattern LON_PATTERN = Pattern.compile("\"lon\":\\s*\"?([\\d.]+)\"?");

    // Simple cache for addresses already resolved
    private final java.util.Map<String, double[]> cache = new java.util.HashMap<>();

    public GeocodingService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public double[] geocode(String address) {
        // Check cache
        if (cache.containsKey(address)) return cache.get(address);

        try {
            String encoded = java.net.URLEncoder.encode(address + ", Wien, Austria", "UTF-8");
            String url = "https://nominatim.openstreetmap.org/search?format=json&q=" + encoded + "&limit=1";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "Freetime-App/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String body = response.body();

            Matcher latMatcher = LAT_PATTERN.matcher(body);
            Matcher lonMatcher = LON_PATTERN.matcher(body);

            if (latMatcher.find() && lonMatcher.find()) {
                double lat = Double.parseDouble(latMatcher.group(1));
                double lon = Double.parseDouble(lonMatcher.group(1));
                double[] coords = {lat, lon};
                cache.put(address, coords);
                return coords;
            }
        } catch (Exception e) {
            // Fall through to default
        }

        // Default: Vienna center
        double[] fallback = {48.2082, 16.3738};
        cache.put(address, fallback);
        return fallback;
    }

    public boolean isWithinRadius(double lat1, double lon1, double lat2, double lon2, double radiusKm) {
        return haversine(lat1, lon1, lat2, lon2) <= radiusKm;
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}