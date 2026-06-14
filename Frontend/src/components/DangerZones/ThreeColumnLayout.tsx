import React from 'react';

interface ThreeColumnLayoutProps {
  children: {
    detailsPanel: React.ReactNode;
    mapContainer: React.ReactNode;
    filtersPanel: React.ReactNode;
  };
  isDetailsPanelCollapsed: boolean;
  isFiltersPanelCollapsed: boolean;
}

/**
 * ThreeColumnLayout Component
 * 
 * Implements a CSS Grid-based three-column layout for the danger zones map view.
 * Dynamically adjusts column widths based on panel collapse states.
 * 
 * Layout Configurations:
 * - Both panels expanded: [380px | flex | 320px]
 * - Details collapsed, filters expanded: [48px | flex | 320px]
 * - Details expanded, filters collapsed: [380px | flex | 48px]
 * - Both panels collapsed: [48px | flex | 48px]
 * 
 * Responsive Breakpoints:
 * - Desktop (≥1280px): Three-column grid with full panel widths
 * - Laptop (1024-1279px): Three-column grid with narrower panels
 * - Mobile (<1024px): Stacked vertical layout (panels hidden, overlays used instead)
 * 
 * @param children - Object containing three child nodes (detailsPanel, mapContainer, filtersPanel)
 * @param isDetailsPanelCollapsed - Boolean indicating if left panel is collapsed
 * @param isFiltersPanelCollapsed - Boolean indicating if right panel is collapsed
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 10.1**
 */
export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  children,
  isDetailsPanelCollapsed,
  isFiltersPanelCollapsed,
}) => {
  // Determine grid column classes based on collapse states
  const getGridColumnsClass = () => {
    // Desktop (≥1280px) configurations
    if (!isDetailsPanelCollapsed && !isFiltersPanelCollapsed) {
      return 'grid-cols-[380px_1fr_320px]';
    }
    if (isDetailsPanelCollapsed && !isFiltersPanelCollapsed) {
      return 'grid-cols-[48px_1fr_320px]';
    }
    if (!isDetailsPanelCollapsed && isFiltersPanelCollapsed) {
      return 'grid-cols-[380px_1fr_48px]';
    }
    if (isDetailsPanelCollapsed && isFiltersPanelCollapsed) {
      return 'grid-cols-[48px_1fr_48px]';
    }
    return 'grid-cols-[380px_1fr_320px]'; // Default fallback
  };

  // Determine laptop grid column classes
  const getLaptopGridColumnsClass = () => {
    if (isDetailsPanelCollapsed && !isFiltersPanelCollapsed) {
      return 'max-xl:grid-cols-[48px_1fr_280px]';
    }
    if (!isDetailsPanelCollapsed && isFiltersPanelCollapsed) {
      return 'max-xl:grid-cols-[320px_1fr_48px]';
    }
    if (isDetailsPanelCollapsed && isFiltersPanelCollapsed) {
      return 'max-xl:grid-cols-[48px_1fr_48px]';
    }
    return 'max-xl:grid-cols-[320px_1fr_280px]'; // Both expanded
  };

  return (
    <div
      className={`grid gap-4 h-full ${getGridColumnsClass()} ${getLaptopGridColumnsClass()} max-lg:grid-cols-1 transition-all duration-300`}
      role="region"
      aria-label="Three-column map layout with collapsible panels"
    >
      {/* Left Details Panel - Hidden on mobile (<1024px), shown as overlay instead */}
      <div className="max-lg:hidden" role="complementary" aria-label="Details panel">
        {children.detailsPanel}
      </div>
      
      {/* Center Map Container - Full width on mobile */}
      <div role="main" aria-label="Danger zones map">
        {children.mapContainer}
      </div>
      
      {/* Right Filters Panel - Hidden on mobile (<1024px), shown as overlay instead */}
      <div className="max-lg:hidden" role="complementary" aria-label="Filters panel">
        {children.filtersPanel}
      </div>
    </div>
  );
};
