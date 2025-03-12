"use client";

import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import geojsonData from "@/utils/countries.json";

interface Country {
  country: string;
  market_percentage: string;
}

interface MapComponentProps {
  countries: Country[];
}

const MapComponent: React.FC<MapComponentProps> = ({ countries }) => {
  // Define bounds for the world map
  const bounds = [
    [-90, -180], // Southwest coordinates
    [90, 180],   // Northeast coordinates
  ];

  const styleCountries = (feature: any) => {
    const geoJsonCountryName =
      feature?.properties?.NAME?.trim()?.toLowerCase() ||
      feature?.properties?.ADMIN?.trim()?.toLowerCase();

    if (!geoJsonCountryName) {
      console.error("Country name not found in GeoJSON:", feature.properties);
      return {
        fillColor: "rgba(50, 50, 50, 0.5)", // Default color for unmatched countries
        fillOpacity: 0.5,
        color: "#444",
        weight: 1,
      };
    }

    const country = countries.find((item) =>
      item.country.trim().toLowerCase() === geoJsonCountryName
    );

    if (country) {
      const percentage = parseInt(country.market_percentage.replace("%", ""), 10);
      const hue = 200 + (percentage / 100) * 60; // Blue to purple range
      const saturation = 70 + (percentage / 100) * 30;
      const lightness = 20 + (percentage / 100) * 30;

      return {
        fillColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        fillOpacity: 0.8,
        color: "#444",
        weight: 1,
      };
    }

    return {
      fillColor: "rgba(50, 50, 50, 0.5)", // Default color for unmatched countries
      fillOpacity: 0.5,
      color: "#444",
      weight: 1,
    };
  };

  const onEachCountry = (feature: any, layer: any) => {
    const countryName = feature?.properties?.NAME || feature?.properties?.ADMIN;
    const country = countries.find(
      (item) => item.country.toLowerCase() === countryName.toLowerCase()
    );

    if (country) {
      const percentage = country.market_percentage;
      layer.bindTooltip(
        `${country.country}: ${percentage} market share`,
        {
          direction: "top",
          sticky: true,
          className: "dark-tooltip", // Custom tooltip class
        }
      );
    }

    layer.on({
      mouseover: (e: any) => {
        const target = e.target;
        target.setStyle({
          weight: 3,
          color: "#6366f1", // Highlight color
        });
      },
      mouseout: (e: any) => {
        const target = e.target;
        target.setStyle({
          weight: 1,
          color: "#444",
        });
      },
    });
  };

  return (
    <>
      <style jsx global>{`
        .dark-tooltip {
          background-color: #1f2937;
          border: 1px solid #374151;
          color: #f3f4f6;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .dark-tooltip::before {
          border-top-color: #1f2937;
        }
        .leaflet-container {
          background-color: #111827;
        }
        .leaflet-control-zoom a {
          background-color: #1f2937 !important;
          color: #f3f4f6 !important;
          border-color: #374151 !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: #374151 !important;
        }
      `}</style>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "500px", width: "100%", background: "#111827" }}
        maxBounds={bounds}
        minZoom={2}
        maxZoom={8}
        maxBoundsViscosity={1.0}
        className="dark-map"
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          noWrap={true}
          bounds={bounds}
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
        />
        <GeoJSON
          data={geojsonData}
          style={styleCountries}
          onEachFeature={onEachCountry}
        />
      </MapContainer>
    </>
  );
};

export default MapComponent;
