import { isAfter, startOfDay } from 'date-fns';

export function getRemainingWorkingDays(settings) {
  const { 
    startDayOfMonth = 2, 
    endDayOfMonth = 20, 
    excludeWeekends = true,
    targetDate: projectTargetDateStr
  } = settings;
  
  const today = startOfDay(new Date());
  const targetDate = projectTargetDateStr ? startOfDay(new Date(projectTargetDateStr)) : new Date(today.getFullYear(), 11, 31);
  
  if (isAfter(today, targetDate)) {
    return 0; // Project has ended
  }
  
  let remaining = 0;
  let curr = new Date(today);
  
  while (!isAfter(curr, targetDate)) {
    const dayOfMonth = curr.getDate();
    // Check if the current day is within the valid monthly window
    if (dayOfMonth >= startDayOfMonth && dayOfMonth <= endDayOfMonth) {
      const isWeekend = curr.getDay() === 0 || curr.getDay() === 6;
      if (!(excludeWeekends && isWeekend)) {
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
    excludeWeekends = true,
    startDate: projectStartDateStr,
    targetDate: projectTargetDateStr
  } = settings;
  
  const today = startOfDay(new Date());
  const startDate = projectStartDateStr ? startOfDay(new Date(projectStartDateStr)) : new Date(today.getFullYear(), 0, 1);
  const targetDate = projectTargetDateStr ? startOfDay(new Date(projectTargetDateStr)) : new Date(today.getFullYear(), 11, 31);
  
  if (isAfter(startDate, targetDate)) return 1;
  
  let total = 0;
  let curr = new Date(startDate);
  
  while (!isAfter(curr, targetDate)) {
    const dayOfMonth = curr.getDate();
    if (dayOfMonth >= startDayOfMonth && dayOfMonth <= endDayOfMonth) {
      const isWeekend = curr.getDay() === 0 || curr.getDay() === 6;
      if (!(excludeWeekends && isWeekend)) {
        total++;
      }
    }
    curr.setDate(curr.getDate() + 1);
  }
  
  return total || 1;
}

export function getWorkingDaysInMonth(settings, date = new Date()) {
  const { startDayOfMonth = 2, endDayOfMonth = 20, excludeWeekends = true } = settings;
  const start = new Date(date.getFullYear(), date.getMonth(), startDayOfMonth);
  const end = new Date(date.getFullYear(), date.getMonth(), endDayOfMonth);
  
  if (isAfter(start, end)) return 0;
  
  let total = 0;
  let curr = new Date(start);
  
  while (!isAfter(curr, end)) {
    const isWeekend = curr.getDay() === 0 || curr.getDay() === 6;
    if (!(excludeWeekends && isWeekend)) {
      total++;
    }
    curr.setDate(curr.getDate() + 1);
  }
  return total || 1;
}

export const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num);
};
