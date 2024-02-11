import type { LatLngExpression } from "leaflet";
import { useEffect } from "react";
import { Marker, useMap } from "react-leaflet";

export default function ViewFocus({
  center,
  showMarker = false,
}: {
  center: LatLngExpression;
  showMarker?: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);

  return showMarker && <Marker position={center} />;
}
