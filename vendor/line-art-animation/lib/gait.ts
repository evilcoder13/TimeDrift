/**
 * @file vendor/line-art-animation/lib/gait.ts
 * Procedural locomotion kinematics, skeletal poses, and step cycle solver.
 * Vendored from JDhruv14/line-art-animation (MIT).
 */

export interface JointPoint {
  x: number;
  y: number;
}

export interface GaitPose {
  hip: JointPoint;
  kneeL: JointPoint;
  ankleL: JointPoint;
  footL: JointPoint;
  kneeR: JointPoint;
  ankleR: JointPoint;
  footR: JointPoint;
  shoulder: JointPoint;
  elbowL: JointPoint;
  handL: JointPoint;
  elbowR: JointPoint;
  handR: JointPoint;
  head: JointPoint;
  groundContactL: boolean;
  groundContactR: boolean;
}

/**
 * Calculates a natural bipedal walk pose given phase [0..2*PI].
 * Standard figure height ~95 units, feet planted at y=120.
 */
export function gait(params: {
  kind?: 'walk' | 'run' | 'shuffle';
  phase: number;
  speed?: number;
}): GaitPose {
  const phase = params.phase % (Math.PI * 2);
  const hipY = 65 + Math.sin(phase * 2) * 3; // Hip bobbing
  const hipX = 0;

  // Leg phases 180 deg apart
  const phaseL = phase;
  const phaseR = phase + Math.PI;

  const solveLeg = (legPhase: number) => {
    const forward = Math.sin(legPhase);
    const lift = Math.max(0, -Math.cos(legPhase));
    
    // Planted foot vs swing
    const footX = forward * 18;
    const footY = 120 - lift * 12;
    const isContact = lift < 0.1;

    // Inverse kinematics for knee
    const legLen = 55;
    const dx = footX - hipX;
    const dy = footY - hipY;
    const dist = Math.min(legLen * 0.98, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);
    const halfAngle = Math.acos(dist / legLen);

    const kneeX = hipX + Math.cos(angle - halfAngle) * (legLen / 2);
    const kneeY = hipY + Math.sin(angle - halfAngle) * (legLen / 2);

    return {
      knee: { x: kneeX, y: kneeY },
      ankle: { x: footX, y: footY - 4 },
      foot: { x: footX + 4, y: footY },
      isContact
    };
  };

  const legL = solveLeg(phaseL);
  const legR = solveLeg(phaseR);

  // Arms counter-swing
  const armSwingL = -Math.sin(phase) * 12;
  const armSwingR = Math.sin(phase) * 12;

  const shoulder = { x: 0, y: 35 + Math.sin(phase * 2) * 1.5 };
  const head = { x: 1 + Math.sin(phase) * 1, y: 18 + Math.sin(phase * 2) * 2 };

  return {
    hip: { x: hipX, y: hipY },
    kneeL: legL.knee,
    ankleL: legL.ankle,
    footL: legL.foot,
    kneeR: legR.knee,
    ankleR: legR.ankle,
    footR: legR.foot,
    shoulder,
    elbowL: { x: armSwingL * 0.6 - 6, y: 48 },
    handL: { x: armSwingL - 4, y: 62 },
    elbowR: { x: armSwingR * 0.6 + 6, y: 48 },
    handR: { x: armSwingR + 4, y: 62 },
    head,
    groundContactL: legL.isContact,
    groundContactR: legR.isContact,
  };
}
