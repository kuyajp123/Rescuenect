import { StatusCard } from '@/components/ui/card/StatusCard';
import { Map } from '@/components/ui/Map';

export const StatusPanel = ({ data }: { data: any }) => {
  return (
    <div className="grid grid-rows-[1fr_2fr] gap-4 h-full">
      <div className="h-full">
        <div className="h-full rounded-lg overflow-hidden">
          {data?.type === 'status' && data.data ? (
            <Map
              key={`map-status-${data.data.id}`}
              data={[
                {
                  uid: data.data.id,
                  lat: data.data.lat,
                  lng: data.data.lng,
                  condition: data.data.condition,
                },
              ]}
              center={[data.data.lat, data.data.lng]}
              hasMapStyleSelector={false}
              zoomControl={false}
              dragging={false}
              hasMapControl={true}
              zoom={15}
              attribution=""
              markerType="status"
            />
          ) : data?.type === 'evacuation' && data.data ? (
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
        {data?.type === 'status' && data.data ? (
          <StatusCard
            className="h-fit max-h-[500px]"
            uid={data.data.id}
            profileImage={data.data.profileImage}
            firstName={data.data.firstName}
            lastName={data.data.lastName}
            phoneNumber={data.data.phoneNumber || ''}
            condition={data.data.condition}
            location={data.data.location}
            note={data.data.originalStatus?.note || ''}
            image={data.data.originalStatus?.image}
            expiresAt={data.data.originalStatus?.expiresAt}
            createdAt={data.data.originalStatus?.createdAt}
            vid={data.data.vid}
            category={data.data.category}
            people={data.data.people}
          />
        ) : data?.type === 'evacuation' && data.data ? (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>Evacuation Center Details Placeholder</p>
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
