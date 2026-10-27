/**
 * Chapter 09: the loss surface and the path a real momentum gradient
 * descent takes over it (computed once, deterministic). Roles are waypoints
 * along the path in date order, from the high-loss start to the current low.
 */
export const loss = (x: number, z: number) =>
  0.3 * ((x - 0.85) ** 2 + 0.8 * (z + 0.55) ** 2) +
  0.16 * Math.sin(2.6 * x + 0.5) * Math.cos(2.2 * z) +
  0.08 * Math.sin(4.1 * x * z) +
  0.35;

/** Gradient descent with momentum from the high corner; [x, z, loss] per step. */
export function descentPath(steps = 160) {
  let x = -1.35;
  let z = 1.25;
  let vx = 0;
  let vz = 0;
  const h = 1e-3;
  const path: [number, number, number][] = [[x, z, loss(x, z)]];
  for (let i = 0; i < steps; i += 1) {
    const gx = (loss(x + h, z) - loss(x - h, z)) / (2 * h);
    const gz = (loss(x, z + h) - loss(x, z - h)) / (2 * h);
    vx = 0.9 * vx - 0.006 * gx;
    vz = 0.9 * vz - 0.006 * gz;
    x += vx;
    z += vz;
    path.push([x, z, loss(x, z)]);
  }
  return path;
}

/** Timeline entries (by role) in descent order, with each waypoint's place along the path (0–1). */
export const WAYPOINTS = [
  { role: "GenAI Job Simulation", short: "BCG X sim", at: 0 },
  { role: "AI / ML Intern", short: "Elevate Labs", at: 0.22 },
  { role: "Python & PostgreSQL Intern", short: "EduPyramids", at: 0.45 },
  { role: "B.Sc. Data Science", short: "B.Sc.", at: 0.7 },
  { role: "AI Expert", short: "AI Expert · now", at: 1 },
] as const;

/** Chapter progress over which the ball travels the whole path. */
export const DESCENT_RANGE = [0.06, 0.88] as const;
