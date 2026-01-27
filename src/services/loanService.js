exports.generateSchedule = (amount, duration, type, startDate) => {
  let schedule = [];
  let installmentAmount = amount / duration;
  let currentDate = new Date(startDate);

  for (let i = 1; i <= duration; i++) {
    if (type == "weekly") {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    schedule.push({
      installmentNo: i,
      dueDate: new Date(currentDate),
      amountDue: installmentAmount,
      status: "unpaid",
    });
  }

  return schedule;
};
