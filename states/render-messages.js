/**
 * Render and return the option menu for logged-in users.
 * @returns {string}
 */
export const renderOptionsMenu = () => `
  *Options Menu*
  1. Attendance
  2. Class Schedule
  3. Courses
  4. Semesters
  5. Menu
  `;

/**
 * Renders and returns the attendance message.
 *
 * @param {import("amizone_api").V1AttendanceRecords} attendance
 * @returns string
 */
export const renderAttendance = (attendance) => {
  let text = "";
  const toPercent = (total, went) => ((went * 100) / total).toFixed(2);
  for (let i = 0; i < attendance.records.length; i += 1) {
    const record = attendance.records[i];
    text += `Course: ${record.Course.name} | Code: ${record.Course.code}
  => ${record.attendance.attended}/${record.attendance.held} (${toPercent(
      record.attendance.held,
      record.attendance.attended
    )}%)

`;
  }
  return text;
};

export const renderSchedule = (schedule) => {
  let text = "";
  text = `*------ Date: ${schedule.classes[0].startTime.substr(0,10)} ------*
  
`
  for (let i = 0; i < schedule.classes.length; i += 1) {
    const record = schedule.classes[i];
    text += `*Course* :${record.course.name} 
*Faculty Name* :${record.faculty}
*Room* :${record.room}
*Time* :${record.startTime.substr(11,5)} - ${record.endTime.substr(11,5)}

`;
  }
  return text;
};


export const renderSemester = (semesters) => {
  let text = "";
  text = `*Current Semester*:${semesters.semesters[0].name}

`;
  for (let i = 1; i < semesters.semesters.length; i += 1) {
    const record = semesters.semesters[i];
    text += `*Semester* :${record.name} 

`;
  }
  return text;
};
