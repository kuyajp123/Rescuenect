# Evacuation Routing System FAQ

This document serves as a repository for questions and technical explanations regarding the behavior of the evacuation routing engine, fallback mechanisms, and geometric simplifications.

## Why is the route limited (straight lines, "Traffic data limited") when passing through a reported danger zone, whereas we get a normal, detailed route when avoiding them?

**Short Answer:**  
This happens because the primary routing engine (OpenRouteService) fails to generate a route that passes *through* a danger zone it is instructed to avoid. The system then falls back to Mapbox Directions API using point exclusions, which can degrade the routing geometry and traffic data.

**Detailed Explanation:**

Our routing system prioritizes safety and utilizes a two-tier approach to generate evacuation routes:

1. **OpenRouteService (Primary Engine - Strict Avoidance)**
   * When there is a valid path that goes completely *around* the danger zones, OpenRouteService handles it perfectly. It natively supports polygon avoidance (`avoid_polygons`) and computes a normal, high-resolution road path that safely avoids the reported danger zone.
   
2. **OpenRouteService Failure**
   * If the user's destination (e.g., a specific evacuation center or hospital) is *inside* the danger zone, or if there are no alternative roads to go around it, OpenRouteService strictly refuses to route through the avoided polygon and fails to find a path.

3. **Mapbox Directions API (Fallback Engine)**
   * To ensure the user is not left completely without directional guidance, the `EvacuationRouteSelectionService` automatically triggers a fallback mechanism and switches to the Mapbox Directions API.
   * **The Limitation:** Mapbox does not natively support polygon avoidance. To mimic it, the backend attempts a "best-effort" workaround by scattering up to 50 exclusion points (`mapbox_exclude_points`) inside the danger zone. 
   * When Mapbox is forced to calculate a route while dodging these scattered points, its road network graph often breaks. As a result, Mapbox returns a severely degraded or simplified geometry (which appears as straight lines jumping across blocks). Additionally, because the route does not cleanly align with the underlying road graph, Mapbox cannot confidently attach traffic data, resulting in the **"Traffic data limited"** status.

In summary, the "limited" route is an intentional fallback behavior ensuring users still receive basic directional guidance when strict safety routing determines that a clean path is impossible.
