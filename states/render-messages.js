import { renderRelativeDate } from "../utils.js";

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
    text += `*Course*: ${record.Course.name} *| Code*: ${record.Course.code}
  => ${record.attendance.attended}/${record.attendance.held} (${toPercent(
      record.attendance.held,
      record.attendance.attended
    )}%)

`;
  }
  return text;
};

export const renderCourses = (courses) => {
  let text = "";
  const toPercent = (total, went) => ((went * 100) / total).toFixed(2);
  for (let i = 0; i < courses.courses.length; i += 1) {
    const course = courses.courses[i];
    const { type } = course;
    const { code, name } = course.ref;
    const attendance = `${course.attendance.attended}/${
      course.attendance.held
    } (${toPercent(course.attendance.held, course.attendance.attended)}%)`;
    const internalMarks = `${course.internalMarks.have}/${course.internalMarks.max}`;
    text += `
*Course*: ${name} *| Code*: ${code}
*Type*: ${type}
*Attendance*: ${attendance}
*Internal Marks*: ${internalMarks}
`;
  }
  return text;
};

export const renderSchedule = (schedule) => {
  let text = "";
  text = `*------ Date: ${schedule.classes[0].startTime.substr(0, 10)} ------*

`;
  for (let i = 0; i < schedule.classes.length; i += 1) {
    const record = schedule.classes[i];
    text += `*Course* :${record.course.name}
*Faculty Name* :${record.faculty}
*Room* :${record.room}
*Time* :${record.startTime.substr(11, 5)} - ${record.endTime.substr(11, 5)}

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

export const renderWelcomeMessage = () => `\
Welcome the the Amibot Beta, proudly brought to you by the ALiAS Community.

Amibot is an open-source project hosted on fly.io. Source code is available at github.com/asetalias/amibot and open to contributions, bug reports and feature requests!

Join ALiAS, Amity's largest open source community, at asetalias.in ;)
`;

export const renderUsernamePrompt = () => "*Enter Username:*";

export const renderPasswordPrompt = () => "*Enter Password:*";

// Menu. Type: Interactive.
export const renderAmizoneMenu = () => ({
  type: "list",
  header: {
    type: "text",
    text: "Options Menu",
  },
  body: {
    text: "Select an Option",
  },
  action: {
    button: "Menu",
    sections: [
      {
        title: "Options",
        rows: [
          {
            id: "1",
            title: "Attendance",
          },
          {
            id: "2",
            title: "Class Schedule",
          },
          {
            id: "3",
            title: "Courses",
          },
          {
            id: "4",
            title: "Semesters",
          },
          {
            id: "5",
            title: "Fill Faculty Feedback",
            description: "Submit feedback for all faculty, in one go 🚀",
          },
          {
            id: "6",
            title: "Logout",
          },
        ],
      },
    ],
  },
});

export const renderClassScheduleDateList = () => {
  const dates = new Array(5);
  for (let i = 0; i < 5; i += 1) {
    dates[i] = renderRelativeDate(i - 2);
  }

  return {
    type: "list",
    header: {
      type: "text",
      text: "Date Selection",
    },
    body: {
      text: "Select the Date",
    },
    action: {
      button: "Options",
      sections: [
        {
          title: "Dates",
          rows: dates.map((dateString, index) => ({
            id: index + 1,
            title: dateString,
            description: index === 2 ? "Today" : "",
          })),
        },
      ],
    },
  };
};

export const renderFacultyFeedbackInstructions =
  () => `This method will submit feedback for *all* your faculty in a single step.

Reply with _cancel_ to abort this operation, or with details in the following format:
_*{Score} {Query score} {Comment}*_

where
→ *Score* is a 1-5 score used for most feedback points (higher is better)
→ *Query score* is a 1-3 score used for query feedback (higher is better)
→ *Comment* is a remark that will be sent with the feedback

Please note that the same scores and comments will be used for all faculties with pending feedbacks.`;

export const renderFacultyFeedbackConfirmaion = (filledFor) =>
  `Faculty feedback has been filled for ${filledFor} faculties.`;
