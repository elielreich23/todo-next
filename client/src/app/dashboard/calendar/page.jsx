
/*
import React from 'react';
import styles from '../style/calendar.module.scss';*/
"use client";

import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { v4 as uuidv4 } from "uuid";

import styles from "./calendar.module.scss";

export default function Calendar() {
  const [events, setEvents] = useState([
    { id: uuidv4(), title: "Project Kickoff", date: "2025-08-29", deadline: true },
  ]);

  const calendarRef = useRef(null);

  // Create Event
  const handleDateClick = (info) => {
    const title = prompt("Enter event title:");
    if (title) {
      const newEvent = {
        id: uuidv4(),
        title,
        start: info.date,
        allDay: info.allDay,
        deadline: false,
      };
      setEvents([...events, newEvent]);
    }
  };

  // Update Event (drag/drop or resize)
  const handleEventChange = (changeInfo) => {
    const updatedEvents = events.map((event) =>
      event.id === changeInfo.event.id
        ? {
            ...event,
            start: changeInfo.event.start,
            end: changeInfo.event.end,
          }
        : event
    );
    setEvents(updatedEvents);
  };

  // Delete Event
  const handleEventClick = (clickInfo) => {
    if (window.confirm(`Delete event '${clickInfo.event.title}'?`)) {
      setEvents(events.filter((event) => event.id !== clickInfo.event.id));
    }
  };

  return (
    <div className={styles.calendarWrapper}>
      <h2 className={styles.calendarTitle}>Calendar View</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        editable={true}
        selectable={true}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        ref={calendarRef}
        eventClassNames={(eventInfo) =>
          eventInfo.event.extendedProps.deadline ? styles.deadlineEvent : ""
        }
      />
    </div>
  );
}
