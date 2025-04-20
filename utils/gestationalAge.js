export const getGA = (dueDate, today = new Date()) => {
    // Firestore Timestamp → Date
    const edd = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
    // 280 days = 40 w gestation
    const diffDays = Math.round((edd - today) / 86400000);
    const totalDays = 280 - diffDays;
    const weeks = Math.max(0, Math.floor(totalDays / 7));
    const days  = Math.max(0, totalDays % 7);
    return { weeks, days, totalDays };
  };
  