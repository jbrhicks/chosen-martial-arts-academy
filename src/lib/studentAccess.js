// Utilities for the parental / minor access-control system.
// A "minor" is any user whose date of birth (dob) makes them under 18 today.

export function computeAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function computeIsMinor(dob) {
  const age = computeAge(dob);
  return age !== null && age < 18;
}