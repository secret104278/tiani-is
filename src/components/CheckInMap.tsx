import type { LatLngExpression } from "leaflet";
import type { ReactNode } from "react";
import { Circle, MapContainer, TileLayer } from "react-leaflet";

import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
});

const GPS_CENTER: LatLngExpression = [22.863541598094525, 120.36627531051637];

export default function CheckInMap({ children }: { children?: ReactNode }) {
  return (
    <MapContainer center={GPS_CENTER} zoom={16} className="flex-grow">
      <Circle center={GPS_CENTER} radius={500} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}
