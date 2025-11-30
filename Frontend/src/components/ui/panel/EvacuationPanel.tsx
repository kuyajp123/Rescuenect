import { Map } from '@/components/ui/Map';

export const EvacuationPanel = ({ data }: { data: any }) => {
  return (
    <div className="grid grid-rows-[1fr_2fr] gap-4 h-full">
      <div className="h-full">
        <div className="h-full rounded-lg overflow-hidden">
          {data?.type === 'evacuation' && data.data ? (
            <Map
              key={`map-evacuation-${data.data.id}`}
              data={[
                {
                  uid: data.data.id,
                  lat: data.data.coordinates?.lat ?? 0,
                  lng: data.data.coordinates?.lng ?? 0,
                },
              ]}
              center={
                data.data.coordinates ? [data.data.coordinates.lat, data.data.coordinates.lng] : [14.2965, 120.7925]
              }
              hasMapStyleSelector={false}
              zoomControl={false}
              dragging={false}
              hasMapControl={true}
              zoom={15}
              attribution=""
              markerType="default"
            />
          ) : (
            <Map
              key="map-default"
              data={[]}
              center={[14.2965, 120.7925]}
              hasMapStyleSelector={false}
              zoomControl={false}
              dragging={false}
              hasMapControl={true}
              zoom={13}
              attribution=""
              markerType="default"
            />
          )}
        </div>
      </div>

      {/* Status Card Section */}
      <div className="min-h-0 overflow-auto">
        {data?.type === 'evacuation' && data.data ? (
          <div className="flex flex-col gap-4">
            <div className="text-wrap max-h-20 overflow-y-auto">{data.data.description}</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {data.data.images.map((imgUrl: string, index: number) => (
                <img
                  key={index}
                  src={imgUrl}
                  alt={`Evacuation Center Image ${index + 1}`}
                  className="w-100 h-100 object-cover rounded-md"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>Select a row from the history table to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
