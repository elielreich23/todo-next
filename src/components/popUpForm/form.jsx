import React, { useState } from "react";
import styles from "./styles.module.scss";


const PopupForm = ({ onClose }) => {
  const [formType, setFormType] = useState(null);

  const openTeamForm = () => {
    setFormType("team");
  };

  const openProjectForm = () => {
    setFormType("project");
  };

  const openTaskForm = () => {
    setFormType("task");
  };

  const openReminderForm = () => {
    setFormType("reminder");
  };

  return (
    <div className={styles.popup-form}>
      {formType === "team" && (
        <>
          {/* Team Form Content */}
          <h2>Create New Team</h2>
          {/* Include form fields and logic for creating a team */}
          {/* create the back button */}
          <button onClick={onClose}>Close</button>
        </>
      )}
      {formType === "project" && (
        <>
          {/* Project Form Content */}
          <h2>Create New Project</h2>
          {/* Include form fields and logic for creating a project */}
          <button onClick={onClose}>Close</button>
        </>
      )}
      {formType === "task" && (
        <>
          {/* Task Form Content */}
          <h2>Create New Task</h2>
          {/* Include form fields and logic for creating a task */}
          <button onClick={onClose}>Close</button>
        </>
      )}
      {formType === "reminder" && (
        <>
          {/* Reminder Form Content */}
          <h2>Create New Reminder</h2>
          {/* Include form fields and logic for creating a reminder */}
          <button onClick={onClose}>Close</button>
        </>
      )}
      {!formType && (
        <>
          <button onClick={openTeamForm}>Create New Team</button>
          <button onClick={openProjectForm}>Create New Project</button>
          <button onClick={openTaskForm}>Create New Task</button>
          <button onClick={openReminderForm}>Create New Reminder</button>
          <button onClick={onClose}>Close</button>
        </>
      )}
    </div>
  );
};

export default PopupForm;
