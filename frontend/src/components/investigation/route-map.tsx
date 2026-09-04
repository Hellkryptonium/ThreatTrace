"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Map as MapboxMap, Marker, Popup } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./route-map.module.css";

export interface RouteMapPoint {
  ip: string;
  hop: number;
  role: "ORIGIN" | "RELAY";
  city?: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  isp?: string;
  asn?: string;
}

interface RouteMapProps { points: RouteMapPoint[]; }

export function RouteMap({ points }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | undefined>(undefined);
  const markersRef = useRef<{ marker: Marker; popup: Popup }[]>([]);
  const [mapError, setMapError] = useState("");
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const styleUrl = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL ?? "mapbox://styles/mapbox/streets-v12";

  useEffect(() => {
    if (!mapContainer.current || !token || !points.length) return;
    setMapError("");
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({ container: mapContainer.current, style: styleUrl, center: [points[0].longitude, points[0].latitude], zoom: 2, trackResize: true });
    mapRef.current = map;
    map.on("error", (event) => {
      const message = event.error?.message ?? "The basemap could not be loaded.";
      setMapError(message);
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      const coordinates = points.map((point) => [point.longitude, point.latitude] as [number, number]);
      map.addSource("mail-route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } } });
      map.addLayer({ id: "mail-route-line", type: "line", source: "mail-route", paint: { "line-color": "#087f78", "line-width": 3, "line-opacity": 0.72, "line-dasharray": [2, 1] } });
      if (coordinates.length > 1) {
        const bounds = coordinates.reduce((value, coordinate) => value.extend(coordinate), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        map.fitBounds(bounds, { padding: 70, maxZoom: 5, duration: 0 });
      }
      for (const point of points) {
        const popup = new mapboxgl.Popup({ offset: 16, closeButton: true }).setHTML(`<strong>${point.role === "ORIGIN" ? "Probable origin" : `Relay hop ${point.hop}`}</strong><br />${point.ip}<br />${[point.city, point.region, point.country].filter(Boolean).join(", ") || "Approximate location unavailable"}<br />${point.isp || point.asn || "Network details unavailable"}`);
        const marker = new mapboxgl.Marker({ color: point.role === "ORIGIN" ? "#c5221f" : "#087f78" }).setLngLat([point.longitude, point.latitude]).setPopup(popup).addTo(map);
        markersRef.current.push({ marker, popup });
      }
      map.resize();
    });
    return () => { markersRef.current.forEach(({ marker, popup }) => { popup.remove(); marker.remove(); }); markersRef.current = []; map.remove(); mapRef.current = undefined; };
  }, [points, styleUrl, token]);

  if (!token) return <div className={styles.unavailable}>Add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to display the interactive route map. Geolocated relay evidence remains available below.</div>;
  if (!points.length) return <div className={styles.unavailable}>No public relay IPs with usable coordinates were found for this message.</div>;
  return <div className={styles.mapFrame}>{mapError ? <div className={styles.unavailable}>Map tiles could not be loaded. Check the MapTiler key&apos;s allowed origin for <code>http://localhost:3000</code>. <span>{mapError}</span></div> : <div className={styles.map} ref={mapContainer} aria-label="Approximate email relay route map" />}<p className={styles.disclaimer}>Approximate network infrastructure inferred from mail headers. This does not identify the sender&apos;s physical location.</p></div>;
}
