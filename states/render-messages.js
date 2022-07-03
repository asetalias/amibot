/**
 * Render and return the option menu for logged-in users.
 * @returns {string}
 */
export const renderOptionsMenu = () => `
  *Options Menu*
  1. Attendance
  2. Class Schedule
  3. Courses
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
