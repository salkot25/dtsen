import { differenceInBusinessDays, isAfter, startOfDay } from 'date-fns';

const TARGET_DATE = new Date(2026, 7, 31); // August 31, 2026 (Month is 0-indexed, so 7 is August)
const TOTAL_TARGET = 206533;

export function getRemainingWorkingDays() {
  const today = startOfDay(new Date());
  
  if (isAfter(today, TARGET_DATE)) {
    return 0; // Target date has passed
  }
  
  // differenceInBusinessDays calculates the number of full business days between two dates.
  return differenceInBusinessDays(TARGET_DATE, today);
}

export function calculateDailyTarget(currentKumulatif) {
  const remainingDays = getRemainingWorkingDays();
  const remainingWork = TOTAL_TARGET - currentKumulatif;
  
  if (remainingDays <= 0) return remainingWork > 0 ? remainingWork : 0;
  
  return Math.ceil(remainingWork / remainingDays);
}

export const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num);
};
