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

export const renderSchedule = (schedule) => {
  let text = "";
  text = `*------ Date: ${schedule.classes[0].startTime.substr(0, 10)} ------*
  
`
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
`

export const renderUsernamePrompt = () => "*Enter Username:*"

export const renderPasswordPrompt = () => "*Enter Password:*"

// Options. Type:Interactive
export const renderOptionButtons = () => ({
    type: "button",
    body: {
      text: `\
Select Options to view details
Select Logout to start over again`
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "opt-menu",
            title: "Options"
          }
        },
        {
          type: "reply",
          reply: {
            id: "opt-logout",
            title: "Logout"
          }
        }
      ]
    }
  })

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
      button: "Options",
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
              title: "Menu",
            },
          ]
        }
      ]
    }
  })
