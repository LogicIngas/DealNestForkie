import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Store as StoreIcon } from 'lucide-react';
import { CATEGORY_ICON } from '../constants/categories';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#0d9488;border:3px solid white;box-shadow:0 0 0 2px #0d9488"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const CAPE_TOWN_CENTER = [-33.9249, 18.4241];

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Recenter({ center }) {
  const map = useMap();
  const [lat, lng] = center;
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function StoreMap({ stores, promotions }) {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const validStores = stores.filter(s => s.latitude && s.longitude);

  const promosByStore = {};
  promotions.forEach(promo => {
    const storeId = promo.store?.storeId;
    if (!storeId) return;
    (promosByStore[storeId] = promosByStore[storeId] || []).push(promo);
  });

  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : validStores.length > 0
      ? [
          validStores.reduce((sum, s) => sum + s.latitude, 0) / validStores.length,
          validStores.reduce((sum, s) => sum + s.longitude, 0) / validStores.length,
        ]
      : CAPE_TOWN_CENTER;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 500 }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {validStores.map(store => {
          const storePromos = promosByStore[store.storeId] || [];
          const cheapest = storePromos.reduce(
            (min, p) => (p.discountPrice != null && (min == null || p.discountPrice < min) ? p.discountPrice : min),
            null
          );
          const distance = userLocation
            ? haversineKm(userLocation.lat, userLocation.lng, store.latitude, store.longitude)
            : null;
          const CatIcon = CATEGORY_ICON[store.category] || StoreIcon;
          return (
            <Marker key={store.storeId} position={[store.latitude, store.longitude]}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  {store.imageUrl && (
                    <img
                      src={store.imageUrl}
                      alt=""
                      style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }}
                    />
                  )}
                  <div style={{ fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CatIcon size={14} /> {store.storeName}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
                    {store.city}{distance != null ? ` · ${distance.toFixed(1)} km away` : ''}
                  </div>
                  {cheapest != null ? (
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0d9488' }}>From R{cheapest.toFixed(2)}</div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#999' }}>No active deals</div>
                  )}
                  <a href={`/store/${store.storeId}`} style={{ fontSize: 12, color: '#0d9488', display: 'inline-block', marginTop: 6 }}>
                    View store →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
