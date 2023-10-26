import type { ReactNode } from "react";
import { Circle, MapContainer, TileLayer } from "react-leaflet";

import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { TIANI_GPS_CENTER, TIANI_GPS_RADIUS_KM } from "~/utils/ui";

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
});

export default function CheckInMap({ children }: { children?: ReactNode }) {
  return (
    <MapContainer center={TIANI_GPS_CENTER} zoom={16} className="flex-grow">
      <Circle center={TIANI_GPS_CENTER} radius={TIANI_GPS_RADIUS_KM * 1000} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}
