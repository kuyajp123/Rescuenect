export const STATE_IMAGES = {
  noChanges: {
    dark: require("@/assets/images/states/noChanges-dark.png"),
    light: require("@/assets/images/states/noChanges-light.png"),
  },
  error: {
    dark: require("@/assets/images/states/Error-dark.png"),
    light: require("@/assets/images/states/Error-light.png"),
  },
  noNetwork: {
    dark: require("@/assets/images/states/noNetwork-dark.png"),
    light: require("@/assets/images/states/noNetwork-light.png"),
  },
};

export type StateImageType = keyof typeof STATE_IMAGES;

// Helper function to get the appropriate image source based on theme
export const getStateImage = (type: StateImageType, isDark: boolean) => {
  return isDark ? STATE_IMAGES[type].dark : STATE_IMAGES[type].light;
};