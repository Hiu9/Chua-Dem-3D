'use strict';

// Shared by the static frontend and the Node.js room server.
const rideStation = Object.freeze({ x: -13.4, z: 5.6, radius: 3.1 });
const rideDuration = 34000;
const rideBoarding = 2400;
const rideCooldown = 900;
const rideVersion = 1;

function rideSchedule(now, delay = rideBoarding) {
  const departure = now + delay;
  return { departure, arrival: departure + rideDuration };
}

function rideProgress(ride, now) {
  if (!ride) return 0;
  return Math.min(1, Math.max(0, (now - ride.departure) / rideDuration));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rideStation, rideSchedule, rideCooldown, rideVersion };
}
