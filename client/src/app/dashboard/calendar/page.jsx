
/*
import React from 'react';
import styles from '../style/calendar.module.scss';*/
"use client";

import React, { useMemo, useState, useRef, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { v4 as uuidv4 } from "uuid";

import styles from "./calendar.module.scss";

// Lazy load FullCalendar
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>Loading calendar...</div>,
  ssr: false,
});

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("timeGridWeek");
  const [query, setQuery] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [draft, setDraft] = useState({
    title: "",
    date: "",
    startTime: "09:30",
    endTime: "10:00",
    link: "",
    guests: "",
    description: "",
    color: "#DBEAFE" // pastel blue default
  });
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null, allDay: false });

  const calendarRef = useRef(null);

  // When selecting a slot, open modal with prefilled date/time
  const handleSelect = (selectionInfo) => {
    setEditingEventId(null);
    setSelectedRange({ start: selectionInfo.start, end: selectionInfo.end, allDay: selectionInfo.allDay });
    const dateIso = selectionInfo.start.toISOString().slice(0, 10);
    const startHm = selectionInfo.start.toTimeString().slice(0, 5);
    const endHm = selectionInfo.end ? selectionInfo.end.toTimeString().slice(0, 5) : "10:00";
    setDraft((d) => ({ ...d, date: dateIso, startTime: startHm, endTime: endHm }));
    setIsModalOpen(true);
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

  // Open edit modal on event click
  const handleEventClick = (clickInfo) => {
    const e = clickInfo.event;
    setEditingEventId(e.id);
    const dateIso = e.start?.toISOString().slice(0, 10) || "";
    const fmt = (n) => String(n).padStart(2, '0');
    const startHm = e.start ? `${fmt(e.start.getHours())}:${fmt(e.start.getMinutes())}` : "09:30";
    const endHm = e.end ? `${fmt(e.end.getHours())}:${fmt(e.end.getMinutes())}` : startHm;
    setDraft({
      title: e.title || "",
      date: dateIso,
      startTime: startHm,
      endTime: endHm,
      link: e.extendedProps?.link || "",
      guests: e.extendedProps?.guests || "",
      description: e.extendedProps?.description || "",
      color: e.backgroundColor || "#DBEAFE",
    });
    setIsModalOpen(true);
  };

  const filteredEvents = useMemo(() => {
    if (!query.trim()) return events;
    const q = query.toLowerCase();
    return events.filter((e) => e.title.toLowerCase().includes(q));
  }, [events, query]);

  const handleViewDidMount = (arg) => {
    setView(arg.view.type);
  };

  const renderEventContent = (eventInfo) => {
    return (
      <div className={styles.eventChip} title={eventInfo.event.title}>
        <span className={styles.eventTitle}>{eventInfo.event.title}</span>
      </div>
    );
  };

  const saveDraftToEvents = () => {
    if (!draft.title.trim() || !draft.date) return;
    const start = new Date(`${draft.date}T${draft.startTime}:00`);
    const end = new Date(`${draft.date}T${draft.endTime}:00`);
    if (editingEventId) {
      setEvents((prev) => prev.map((ev) => ev.id === editingEventId ? {
        ...ev,
        title: draft.title.trim(),
        start,
        end,
        backgroundColor: draft.color,
        borderColor: "transparent",
        extendedProps: { ...ev.extendedProps, link: draft.link, guests: draft.guests, description: draft.description }
      } : ev));
    } else {
      const newEvent = {
        id: uuidv4(),
        title: draft.title.trim(),
        start,
        end,
        backgroundColor: draft.color,
        borderColor: "transparent",
        extendedProps: { link: draft.link, guests: draft.guests, description: draft.description }
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    setIsModalOpen(false);
    setEditingEventId(null);
    setDraft({ title: "", date: "", startTime: "09:30", endTime: "10:00", link: "", guests: "", description: "", color: "#DBEAFE" });
  };

  const deleteCurrentEvent = () => {
    if (!editingEventId) return;
    setEvents((prev) => prev.filter((e) => e.id !== editingEventId));
    setIsModalOpen(false);
    setEditingEventId(null);
  };

  if (!pluginsLoaded) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>Loading calendar...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={styles.calendarWrapper}>
      <div className={styles.headerBar}>
        <div className={styles.leftControls}>
          <div className={styles.monthTitle}>{new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date())}</div>
          <div className={styles.navButtons}>
            <button onClick={() => calendarRef.current?.getApi().today()}>Today</button>
            <button onClick={() => calendarRef.current?.getApi().prev()} aria-label="Previous">◄</button>
            <button onClick={() => calendarRef.current?.getApi().next()} aria-label="Next">►</button>
          </div>
        </div>
        <div className={styles.rightControls}>
          <div className={styles.viewTabs}>
            <button className={`${styles.tabBtn} ${view === "timeGridDay" ? styles.active : ""}`} onClick={() => calendarRef.current?.getApi().changeView("timeGridDay")}>Day</button>
            <button className={`${styles.tabBtn} ${view === "timeGridWeek" ? styles.active : ""}`} onClick={() => calendarRef.current?.getApi().changeView("timeGridWeek")}>Week</button>
            <button className={`${styles.tabBtn} ${view === "dayGridMonth" ? styles.active : ""}`} onClick={() => calendarRef.current?.getApi().changeView("dayGridMonth")}>Month</button>
          </div>
          <input className={styles.searchInput} placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <FullCalendar
        plugins={plugins}
        initialView="timeGridWeek"
        headerToolbar={false}
        events={filteredEvents}
        select={handleSelect}
        eventClick={handleEventClick}
        editable={true}
        selectable={true}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        ref={calendarRef}
        viewDidMount={handleViewDidMount}
        eventContent={renderEventContent}
        eventClassNames={(eventInfo) =>
          ""
        }
      />

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>{editingEventId ? "Edit Schedule" : "Add Schedule"}</div>
            <div className={styles.modalBody}>
              <label className={styles.field}>
                <span>New event title</span>
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="New event title" />
              </label>
              <label className={styles.inlineField}>
                <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </label>
              <div className={styles.timeRow}>
                <div className={styles.timeField}>
                  <span>Start</span>
                  <input type="time" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
                </div>
                <div className={styles.timeField}>
                  <span>End</span>
                  <input type="time" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
                </div>
              </div>
              <label className={styles.field}>
                <span>Add guest</span>
                <input value={draft.guests} onChange={(e) => setDraft({ ...draft, guests: e.target.value })} placeholder="name@email.com" />
              </label>
              <label className={styles.field}>
                <span>Link</span>
                <input value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="https://meet.google.com/..." />
              </label>
              <label className={styles.field}>
                <span>Add description</span>
                <textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Notes, agenda, etc." />
              </label>
              <div className={styles.colorsRow}>
                {["#DBEAFE", "#E9D5FF", "#FDE68A", "#BBF7D0", "#FBCFE8", "#BAE6FD"].map((c) => (
                  <button
                    key={c}
                    className={`${styles.colorDot} ${draft.color === c ? styles.colorDotActive : ""}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setDraft({ ...draft, color: c })}
                    aria-label={"color-" + c}
                  />
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              {editingEventId && <button className={styles.deleteBtn} onClick={deleteCurrentEvent}>Delete</button>}
              <div style={{ flex: 1 }} />
              <button className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={saveDraftToEvents}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
