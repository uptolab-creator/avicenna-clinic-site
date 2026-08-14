import { useEffect, useRef, useState } from "react";

const MAPS_API_KEY = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as
  | string
  | undefined;

let mapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Не удалось загрузить карту"));
    document.head.appendChild(script);
  });
  return mapsLoadPromise;
}

export type BranchPoint = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export function BranchesGoogleMap({ points }: { points: BranchPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!MAPS_API_KEY) {
      setError("Карта не настроена");
      return;
    }
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const first = points[0];
        const map = new google.maps.Map(containerRef.current, {
          zoom: 12,
          center: { lat: first?.latitude ?? 42.874, lng: first?.longitude ?? 74.606 },
          mapTypeControl: false,
          streetViewControl: false,
        });

        const bounds = new google.maps.LatLngBounds();
        const infoWindow = new google.maps.InfoWindow();

        points.forEach((point) => {
          const position = { lat: point.latitude, lng: point.longitude };
          const marker = new google.maps.Marker({
            position,
            map,
            title: point.name,
          });
          bounds.extend(position);
          marker.addListener("click", () => {
            infoWindow.setContent(
              `<div style="font-family:inherit"><div style="font-weight:700">${point.name}</div><div style="margin-top:2px">${point.address}</div></div>`,
            );
            infoWindow.open({ map, anchor: marker });
          });
        });

        if (points.length > 1) map.fitBounds(bounds);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка карты"));

    return () => {
      cancelled = true;
    };
  }, [points]);

  if (error) {
    return (
      <div className="border-border bg-muted text-muted-foreground flex h-full min-h-[360px] items-center justify-center rounded-xl border text-sm">
        {error}
      </div>
    );
  }

  return <div ref={containerRef} className="h-full min-h-[360px] w-full rounded-xl" />;
}
