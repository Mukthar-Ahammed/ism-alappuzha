export interface Transform3D {
  x: number; // Normalized viewport coordinates (-1 to 1 or 3D units)
  y: number;
  z: number;
  rotX: number; // Radians
  rotY: number; // Radians
  rotZ: number; // Radians
  scale: number;
  opacity: number;
}

export interface SectionSceneConfig {
  anchorId: string;
  desktop: Transform3D;
  mobile: Transform3D;
}

export const sceneConfig: SectionSceneConfig[] = [
  // 1. Hero (#top) - Large on right side, floating
  {
    anchorId: "top",
    desktop: {
      x: 2.2,
      y: 0.1,
      z: 0,
      rotX: 0.25,
      rotY: -0.4,
      rotZ: 0.05,
      scale: 1.1,
      opacity: 1,
    },
    mobile: {
      x: 0,
      y: 1.8,
      z: 0,
      rotX: 0.3,
      rotY: -0.2,
      rotZ: 0,
      scale: 0.75,
      opacity: 1,
    },
  },

  // 2. Live Now (#live) - Small top right corner
  {
    anchorId: "live",
    desktop: {
      x: 2.8,
      y: 0.8,
      z: 0,
      rotX: 0.1,
      rotY: 0.8,
      rotZ: -0.1,
      scale: 0.45,
      opacity: 0.95,
    },
    mobile: {
      x: 1.6,
      y: -2.4,
      z: 0,
      rotX: 0.1,
      rotY: 0.5,
      rotZ: 0,
      scale: 0.35,
      opacity: 0.9,
    },
  },

  // 3. Videos (#videos) - Drift left edge, tilted
  {
    anchorId: "videos",
    desktop: {
      x: -2.8,
      y: 0.2,
      z: 0,
      rotX: -0.2,
      rotY: -0.6,
      rotZ: 0.15,
      scale: 0.42,
      opacity: 0.9,
    },
    mobile: {
      x: 1.6,
      y: -2.4,
      z: 0,
      rotX: 0.1,
      rotY: 0.5,
      rotZ: 0,
      scale: 0.35,
      opacity: 0.9,
    },
  },

  // 4. Latest Issue (#issue) - Beside magazine cover
  {
    anchorId: "issue",
    desktop: {
      x: -1.8,
      y: -0.1,
      z: 0,
      rotX: 0.15,
      rotY: -0.35,
      rotZ: -0.1,
      scale: 0.55,
      opacity: 0.95,
    },
    mobile: {
      x: 1.6,
      y: -2.4,
      z: 0,
      rotX: 0.1,
      rotY: 0.5,
      rotZ: 0,
      scale: 0.35,
      opacity: 0.9,
    },
  },

  // 5. Namaz Guide (#namaz) - Follows timeline at left edge
  {
    anchorId: "namaz",
    desktop: {
      x: -2.9,
      y: 0,
      z: 0,
      rotX: 0.2,
      rotY: 0.5,
      rotZ: 0,
      scale: 0.4,
      opacity: 0.95,
    },
    mobile: {
      x: 1.6,
      y: -2.4,
      z: 0,
      rotX: 0.1,
      rotY: 0.5,
      rotZ: 0,
      scale: 0.35,
      opacity: 0.9,
    },
  },

  // 6. Dhikr Library (#dhikr) - Right side slow bob
  {
    anchorId: "dhikr",
    desktop: {
      x: 2.7,
      y: 0.2,
      z: 0,
      rotX: 0.1,
      rotY: -0.5,
      rotZ: 0.1,
      scale: 0.45,
      opacity: 0.95,
    },
    mobile: {
      x: 1.6,
      y: -2.4,
      z: 0,
      rotX: 0.1,
      rotY: 0.5,
      rotZ: 0,
      scale: 0.35,
      opacity: 0.9,
    },
  },

  // 7. Q&A (#qna) - Near ask form
  {
    anchorId: "qna",
    desktop: {
      x: -2.7,
      y: 0.3,
      z: 0,
      rotX: 0.15,
      rotY: 0.4,
      rotZ: -0.05,
      scale: 0.42,
      opacity: 0.95,
    },
    mobile: {
      x: 1.6,
      y: -2.4,
      z: 0,
      rotX: 0.1,
      rotY: 0.5,
      rotZ: 0,
      scale: 0.35,
      opacity: 0.9,
    },
  },

  // 8. Leadership (#leaders) - Center timeline
  {
    anchorId: "leaders",
    desktop: {
      x: 0,
      y: 0.2,
      z: 0,
      rotX: 0.1,
      rotY: 0,
      rotZ: 0,
      scale: 0.48,
      opacity: 0.95,
    },
    mobile: {
      x: 1.6,
      y: -2.4,
      z: 0,
      rotX: 0.1,
      rotY: 0.5,
      rotZ: 0,
      scale: 0.35,
      opacity: 0.9,
    },
  },

  // 9. Footer (#footer) - Upright above footer, then fades out
  {
    anchorId: "footer",
    desktop: {
      x: 0,
      y: 1.2,
      z: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scale: 0.38,
      opacity: 0,
    },
    mobile: {
      x: 0,
      y: 1.2,
      z: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scale: 0.3,
      opacity: 0,
    },
  },
];
