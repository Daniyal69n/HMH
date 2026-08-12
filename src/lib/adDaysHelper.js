export async function syncUserAdDays(user) {
  if (!user || typeof user.adWatchDaysLeft !== 'number') {
    return false;
  }

  const now = new Date();
  const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const currentDate = pktTime.toISOString().split('T')[0];

  let modified = false;

  if (!user.lastDayReducedDate) {
    // For existing users or newly bought plans, set the initial date to today
    // so they don't lose a day immediately. They will lose a day tomorrow at 12:00 AM.
    user.lastDayReducedDate = currentDate;
    modified = true;
  } else if (user.lastDayReducedDate !== currentDate) {
    // Calculate days passed
    const lastDate = new Date(user.lastDayReducedDate);
    const currDate = new Date(currentDate);
    const diffTime = currDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0 && user.adWatchDaysLeft > 0) {
      user.adWatchDaysLeft = Math.max(0, user.adWatchDaysLeft - diffDays);
      user.lastDayReducedDate = currentDate;
      modified = true;
    } else if (diffDays > 0 && user.adWatchDaysLeft === 0) {
      // Just update the date to stay current without reducing past 0
      user.lastDayReducedDate = currentDate;
      modified = true;
    }
  }

  return modified;
}
