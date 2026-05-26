import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  useDisclosure,
} from '@heroui/react';
import { CircleHelp } from 'lucide-react';

export const MapSettingsHelpModal = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Tooltip content="Map settings guide">
        <Button isIconOnly size="sm" variant="flat" aria-label="Open map settings guide" onPress={onOpen}>
          <CircleHelp size={16} />
        </Button>
      </Tooltip>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl" scrollBehavior="inside">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span>Map Settings Guide</span>
                <span className="text-sm font-normal text-default-500">
                  Use these settings to keep every LGU map centered and limited to the approved municipality or city
                  scope.
                </span>
              </ModalHeader>
              <ModalBody className="gap-5 text-sm text-default-600">
                <section className="space-y-2">
                  <h3 className="font-semibold text-foreground">Center Coordinates</h3>
                  <p>
                    Center latitude and longitude are the default point where the map opens. Use the LGU municipal or
                    city center, municipal hall, command center, or verified weather reference point.
                  </p>
                  <p>
                    Latitude is north/south, usually around <code>14.x</code> in Cavite. Longitude is east/west,
                    usually around <code>120.x</code>. These fields use plain decimal degrees.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-foreground">Zoom Rules</h3>
                  <p>
                    Minimum zoom controls how far out the map can go. Default zoom controls the first map view. Maximum
                    zoom controls how far in the map can go.
                  </p>
                  <div className="rounded-lg bg-default-100 p-3 font-mono text-xs text-default-700">
                    minZoom: 12 to 13
                    <br />
                    zoom: minZoom to 17
                    <br />
                    maxZoom: zoom to 18
                    <br />
                    recommended default: minZoom 13, zoom 15, maxZoom 18
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-foreground">Bounds</h3>
                  <p>
                    Bounds are the rectangle that limits map movement. The map cannot be dragged outside this approved
                    area.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p>
                      <strong>North Bound</strong>: highest latitude.
                    </p>
                    <p>
                      <strong>South Bound</strong>: lowest latitude.
                    </p>
                    <p>
                      <strong>East Bound</strong>: highest longitude.
                    </p>
                    <p>
                      <strong>West Bound</strong>: lowest longitude.
                    </p>
                  </div>
                  <p>
                    Super Admins should prefer uploading a verified boundary GeoJSON because the backend computes these
                    four bounds automatically from the polygon.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-foreground">Boundary GeoJSON</h3>
                  <p>
                    GeoJSON is a JSON map format. Upload a municipality or city boundary as a
                    <code> FeatureCollection</code>, <code>Feature</code>, <code>Polygon</code>, or
                    <code> MultiPolygon</code>.
                  </p>
                  <p>
                    GeoJSON coordinate order is always <code>[longitude, latitude]</code>. This is the opposite of many
                    map labels that show latitude first.
                  </p>
                  <pre className="overflow-auto rounded-lg bg-default-100 p-3 text-xs text-default-700">
{`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Example City" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [120.8501, 14.2741],
            [120.9205, 14.2741],
            [120.9205, 14.3452],
            [120.8501, 14.3452],
            [120.8501, 14.2741]
          ]
        ]
      }
    }
  ]
}`}
                  </pre>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-foreground">Boundary Source</h3>
                  <p>
                    Enter where the boundary came from, such as PSA PSGC, NAMRIA, LGU GIS office, official city planning
                    office, or an internal verified file name. This helps reviewers know whether the boundary is trusted.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold text-foreground">Approval Flow</h3>
                  <p>
                    LGU Admins submit map setting changes as proposals. The values do not apply immediately. Super
                    Admins review the proposal, verify the scope, and approve it before the client maps change.
                  </p>
                </section>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Got it
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
