import { isAfter, startOfDay } from 'date-fns';

export function parseLocalDate(dateValue) {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    // Extract YYYY-MM-DD date part from datetime strings to avoid timezone shifts
    let datePart = dateValue;
    if (dateValue.includes('T')) {
      datePart = dateValue.split('T')[0];
    } else if (dateValue.includes(' ')) {
      datePart = dateValue.split(' ')[0];
    }
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  return new Date(dateValue);
}

export function getRemainingWorkingDays(settings) {
  const { 
    startDayOfMonth = 2, 
    endDayOfMonth = 20, 
    excludeSaturday = true,
    excludeSunday = true,
    targetDate: projectTargetDateStr
  } = settings;
  
  const today = startOfDay(new Date());
  const targetDate = projectTargetDateStr ? startOfDay(parseLocalDate(projectTargetDateStr)) : new Date(today.getFullYear(), 11, 31);
  
  if (isAfter(today, targetDate)) {
    return 0; // Project has ended
  }
  
  let remaining = 0;
  let curr = new Date(today);
  
  while (!isAfter(curr, targetDate)) {
    const dayOfMonth = curr.getDate();
    // Check if the current day is within the valid monthly window
    if (dayOfMonth >= startDayOfMonth && dayOfMonth <= endDayOfMonth) {
      const dayOfWeek = curr.getDay();
      const isExcludedWeekend = (excludeSaturday && dayOfWeek === 6) || (excludeSunday && dayOfWeek === 0);
      if (!isExcludedWeekend) {
        remaining++;
      }
    }
    curr.setDate(curr.getDate() + 1);
  }
  
  return remaining;
}

export function calculateDailyTarget(currentKumulatif, settings) {
  const remainingDays = getRemainingWorkingDays(settings);
  const remainingWork = settings.totalTarget - currentKumulatif;
  
  if (remainingDays <= 0) return remainingWork > 0 ? remainingWork : 0;
  
  return Math.ceil(remainingWork / remainingDays);
}

export function getTotalWorkingDays(settings) {
  const { 
    startDayOfMonth = 2, 
    endDayOfMonth = 20, 
    excludeSaturday = true,
    excludeSunday = true,
    startDate: projectStartDateStr,
    targetDate: projectTargetDateStr
  } = settings;
  
  const today = startOfDay(new Date());
  const startDate = projectStartDateStr ? startOfDay(parseLocalDate(projectStartDateStr)) : new Date(today.getFullYear(), 0, 1);
  const targetDate = projectTargetDateStr ? startOfDay(parseLocalDate(projectTargetDateStr)) : new Date(today.getFullYear(), 11, 31);
  
  if (isAfter(startDate, targetDate)) return 1;
  
  let total = 0;
  let curr = new Date(startDate);
  
  while (!isAfter(curr, targetDate)) {
    const dayOfMonth = curr.getDate();
    if (dayOfMonth >= startDayOfMonth && dayOfMonth <= endDayOfMonth) {
      const dayOfWeek = curr.getDay();
      const isExcludedWeekend = (excludeSaturday && dayOfWeek === 6) || (excludeSunday && dayOfWeek === 0);
      if (!isExcludedWeekend) {
        total++;
      }
    }
    curr.setDate(curr.getDate() + 1);
  }
  
  return total || 1;
}

export function getWorkingDaysInMonth(settings, date = new Date()) {
  const { startDayOfMonth = 2, endDayOfMonth = 20, excludeSaturday = true, excludeSunday = true } = settings;
  const start = new Date(date.getFullYear(), date.getMonth(), startDayOfMonth);
  const end = new Date(date.getFullYear(), date.getMonth(), endDayOfMonth);
  
  if (isAfter(start, end)) return 0;
  
  let total = 0;
  let curr = new Date(start);
  
  while (!isAfter(curr, end)) {
    const dayOfWeek = curr.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    const isExcludedWeekend = (excludeSaturday && isSaturday) || (excludeSunday && isSunday);

    if (!isExcludedWeekend) {
      total++;
    }
    curr.setDate(curr.getDate() + 1);
  }
  return total || 1;
}

export const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num);
};
