"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { API_ENDPOINTS } from "../../../constants";
import { api } from "../../../lib/api";
import styles from "./calendar.module.scss";

const calendarPlugins = [dayGridPlugin, timeGridPlugin, interactionPlugin];
const emptyDraft = {
  type: "task",
  title: "",
  date: "",
  startTime: "09:30",
  endTime: "10:00",
  projectId: "",
  status: "todo",
  priority: "medium",
  link: "",
  guests: "",
  description: "",
  color: "#DBEAFE",
};

const pad = (value) => String(value).padStart(2, "0");

const toLocalDate = (date) => {
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const toLocalTime = (date, fallback = "09:30") => {
  if (!date) return fallback;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const buildDate = (date, time) => new Date(`${date}T${time || "00:00"}:00`);

const taskColor = (task) => {
  if (task.status === "completed") return "#BBF7D0";
  if (task.priority === "high") return "#FECACA";
  if (task.priority === "low") return "#BAE6FD";
  return "#DBEAFE";
};

const mapTaskToEvent = (task) => ({
  id: `task-${task.id}`,
  title: task.title,
  start: task.due_date,
  end: task.due_date,
  backgroundColor: taskColor(task),
  borderColor: "transparent",
  extendedProps: {
    source: "task",
    taskId: task.id,
    projectId: task.project,
    status: task.status || "todo",
    priority: task.priority || "medium",
    description: task.description || "",
    project: task.project_name || "",
  },
});

const mapCustomEvent = (event) => ({
  id: `event-${event.id}`,
  title: event.title,
  start: event.start,
  end: event.end,
  backgroundColor: event.color || "#DBEAFE",
  borderColor: "transparent",
  extendedProps: {
    source: "custom",
    eventId: event.id,
    link: event.link || "",
    guests: event.guests || "",
    description: event.description || "",
  },
});

export default function CalendarClient() {
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState("timeGridWeek");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const calendarRef = useRef(null);

  const loadCalendarData = useCallback(async () => {
    try {
      const [tasksResponse, eventsResponse, projectsResponse] = await Promise.all([
        api(API_ENDPOINTS.TASKS.LIST, undefined, false),
        api(API_ENDPOINTS.CALENDAR.EVENTS, undefined, false),
        api(API_ENDPOINTS.PROJECTS.LIST, undefined, false),
      ]);

      const taskEvents = (tasksResponse.tasks || []).filter((task) => task.due_date).map(mapTaskToEvent);
      const customEvents = (eventsResponse.events || []).map(mapCustomEvent);
      setEvents([...taskEvents, ...customEvents]);
      setProjects(projectsResponse.projects || []);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
      setFeedback(error instanceof Error ? error.message : "Failed to load calendar data.");
    }
  }, []);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingEventId(null);
    setFeedback("");
  };

  const openDraftForSelection = (selectionInfo) => {
    resetDraft();
    const fallbackProject = projects[0]?.id ? String(projects[0].id) : "";
    setDraft({
      ...emptyDraft,
      date: toLocalDate(selectionInfo.start),
      startTime: toLocalTime(selectionInfo.start),
      endTime: toLocalTime(selectionInfo.end, "10:00"),
      projectId: fallbackProject,
    });
    setIsModalOpen(true);
  };

  const openDraftForEvent = (clickInfo) => {
    const event = clickInfo.event;
    const source = event.extendedProps?.source;
    setEditingEventId(event.id);
    setFeedback("");
    setDraft({
      type: source === "task" ? "task" : "event",
      title: event.title || "",
      date: toLocalDate(event.start),
      startTime: toLocalTime(event.start),
      endTime: toLocalTime(event.end, toLocalTime(event.start, "10:00")),
      projectId: event.extendedProps?.projectId ? String(event.extendedProps.projectId) : "",
      status: event.extendedProps?.status || "todo",
      priority: event.extendedProps?.priority || "medium",
      link: event.extendedProps?.link || "",
      guests: event.extendedProps?.guests || "",
      description: event.extendedProps?.description || "",
      color: event.backgroundColor || "#DBEAFE",
    });
    setIsModalOpen(true);
  };

  const updateEventDate = async (changeInfo) => {
    const source = changeInfo.event.extendedProps?.source;
    const start = changeInfo.event.start?.toISOString();
    const end = changeInfo.event.end?.toISOString() || start;

    try {
      if (source === "task") {
        await api(API_ENDPOINTS.TASKS.DETAIL(changeInfo.event.extendedProps.taskId), {
          method: "PUT",
          body: JSON.stringify({ due_date: start }),
        });
      } else {
        await api(API_ENDPOINTS.CALENDAR.EVENT_DETAIL(changeInfo.event.extendedProps.eventId), {
          method: "PUT",
          body: JSON.stringify({ start, end }),
        });
      }
      await loadCalendarData();
    } catch (error) {
      console.error("Failed to update calendar item:", error);
      changeInfo.revert?.();
      setFeedback(error instanceof Error ? error.message : "Failed to update calendar item.");
    }
  };

  const filteredEvents = useMemo(() => {
    if (!query.trim()) return events;
    const q = query.toLowerCase();
    return events.filter((event) => {
      const haystack = [
        event.title,
        event.extendedProps?.description,
        event.extendedProps?.project,
        event.extendedProps?.guests,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [events, query]);

  const saveDraft = async () => {
    if (!draft.title.trim() || !draft.date) {
      setFeedback("Add a title and date before saving.");
      return;
    }

    const start = buildDate(draft.date, draft.startTime);
    let end = buildDate(draft.date, draft.endTime);
    if (end <= start) {
      end = new Date(start.getTime() + 30 * 60 * 1000);
    }

    setIsSaving(true);
    setFeedback("");

    try {
      if (draft.type === "task") {
        if (!draft.projectId) {
          setFeedback("Choose a project before creating a task.");
          return;
        }

        const payload = {
          title: draft.title.trim(),
          description: draft.description,
          priority: draft.priority,
          status: draft.status,
          due_date: start.toISOString(),
          project: Number(draft.projectId),
        };

        const taskId = editingEventId?.startsWith("task-") ? Number(editingEventId.replace("task-", "")) : null;
        await api(taskId ? API_ENDPOINTS.TASKS.DETAIL(taskId) : API_ENDPOINTS.TASKS.LIST, {
          method: taskId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        });
      } else {
        const payload = {
          title: draft.title.trim(),
          start: start.toISOString(),
          end: end.toISOString(),
          link: draft.link,
          guests: draft.guests,
          description: draft.description,
          color: draft.color,
        };

        const eventId = editingEventId?.startsWith("event-") ? Number(editingEventId.replace("event-", "")) : null;
        await api(eventId ? API_ENDPOINTS.CALENDAR.EVENT_DETAIL(eventId) : API_ENDPOINTS.CALENDAR.EVENTS, {
          method: eventId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        });
      }

      await loadCalendarData();
      setIsModalOpen(false);
      resetDraft();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to save calendar item.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCurrentEvent = async () => {
    if (!editingEventId?.startsWith("event-")) return;
    setIsSaving(true);
    setFeedback("");

    try {
      await api(API_ENDPOINTS.CALENDAR.EVENT_DETAIL(Number(editingEventId.replace("event-", ""))), {
        method: "DELETE",
      });
      await loadCalendarData();
      setIsModalOpen(false);
      resetDraft();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to delete event.");
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    resetDraft();
  };

  const renderEventContent = (eventInfo) => (
    <div className={styles.eventChip} title={eventInfo.event.title}>
      <span className={styles.eventSource}>
        {eventInfo.event.extendedProps?.source === "task" ? "Task" : "Event"}
      </span>
      <span className={styles.eventTitle}>{eventInfo.event.title}</span>
    </div>
  );

  return (
    <div className={styles.calendarWrapper}>
      <div className={styles.headerBar}>
        <div className={styles.leftControls}>
          <div className={styles.monthTitle}>
            {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date())}
          </div>
          <div className={styles.navButtons}>
            <button type="button" onClick={() => calendarRef.current?.getApi().today()}>
              Today
            </button>
            <button type="button" onClick={() => calendarRef.current?.getApi().prev()} aria-label="Previous">
              {"<"}
            </button>
            <button type="button" onClick={() => calendarRef.current?.getApi().next()} aria-label="Next">
              {">"}
            </button>
          </div>
        </div>
        <div className={styles.rightControls}>
          <button type="button" className={styles.addBtn} onClick={() => openDraftForSelection({ start: new Date() })}>
            Add
          </button>
          <div className={styles.viewTabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${view === "timeGridDay" ? styles.active : ""}`}
              onClick={() => calendarRef.current?.getApi().changeView("timeGridDay")}
            >
              Day
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${view === "timeGridWeek" ? styles.active : ""}`}
              onClick={() => calendarRef.current?.getApi().changeView("timeGridWeek")}
            >
              Week
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${view === "dayGridMonth" ? styles.active : ""}`}
              onClick={() => calendarRef.current?.getApi().changeView("dayGridMonth")}
            >
              Month
            </button>
          </div>
          <input
            className={styles.searchInput}
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      {feedback && <div className={styles.inlineAlert}>{feedback}</div>}

      <FullCalendar
        plugins={calendarPlugins}
        initialView="timeGridWeek"
        headerToolbar={false}
        events={filteredEvents}
        select={openDraftForSelection}
        eventClick={openDraftForEvent}
        editable
        selectable
        eventDrop={updateEventDate}
        eventResize={updateEventDate}
        ref={calendarRef}
        viewDidMount={(arg) => setView(arg.view.type)}
        eventContent={renderEventContent}
        eventClassNames={() => ""}
      />

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>{editingEventId ? "Edit Calendar Item" : "Add Calendar Item"}</div>
            <div className={styles.modalBody}>
              <div className={styles.segmentedControl}>
                <button
                  type="button"
                  className={draft.type === "task" ? styles.segmentActive : ""}
                  onClick={() => setDraft({ ...draft, type: "task" })}
                  disabled={Boolean(editingEventId)}
                >
                  Task
                </button>
                <button
                  type="button"
                  className={draft.type === "event" ? styles.segmentActive : ""}
                  onClick={() => setDraft({ ...draft, type: "event" })}
                  disabled={Boolean(editingEventId)}
                >
                  Event
                </button>
              </div>

              <label className={styles.field}>
                <span>Title</span>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder={draft.type === "task" ? "Task title" : "Event title"}
                />
              </label>

              {draft.type === "task" && (
                <label className={styles.field}>
                  <span>Project</span>
                  <select
                    value={draft.projectId}
                    onChange={(event) => setDraft({ ...draft, projectId: event.target.value })}
                  >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className={styles.inlineField}>
                <input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
              </label>

              <div className={styles.timeRow}>
                <div className={styles.timeField}>
                  <span>{draft.type === "task" ? "Due" : "Start"}</span>
                  <input
                    type="time"
                    value={draft.startTime}
                    onChange={(event) => setDraft({ ...draft, startTime: event.target.value })}
                  />
                </div>
                {draft.type === "event" && (
                  <div className={styles.timeField}>
                    <span>End</span>
                    <input
                      type="time"
                      value={draft.endTime}
                      onChange={(event) => setDraft({ ...draft, endTime: event.target.value })}
                    />
                  </div>
                )}
              </div>

              {draft.type === "task" ? (
                <div className={styles.timeRow}>
                  <label className={styles.field}>
                    <span>Status</span>
                    <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Priority</span>
                    <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                </div>
              ) : (
                <>
                  <label className={styles.field}>
                    <span>Guests</span>
                    <input
                      value={draft.guests}
                      onChange={(event) => setDraft({ ...draft, guests: event.target.value })}
                      placeholder="name@email.com"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Link</span>
                    <input
                      value={draft.link}
                      onChange={(event) => setDraft({ ...draft, link: event.target.value })}
                      placeholder="https://meet.google.com/..."
                    />
                  </label>
                </>
              )}

              <label className={styles.field}>
                <span>Description</span>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  placeholder="Notes, agenda, or task details"
                />
              </label>

              {draft.type === "event" && (
                <div className={styles.colorsRow}>
                  {["#DBEAFE", "#E9D5FF", "#FDE68A", "#BBF7D0", "#FBCFE8", "#BAE6FD"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`${styles.colorDot} ${draft.color === color ? styles.colorDotActive : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setDraft({ ...draft, color })}
                      aria-label={`Use color ${color}`}
                    />
                  ))}
                </div>
              )}

              {feedback && <div className={styles.modalAlert}>{feedback}</div>}
            </div>
            <div className={styles.modalFooter}>
              {editingEventId?.startsWith("event-") && (
                <button type="button" className={styles.deleteBtn} onClick={deleteCurrentEvent} disabled={isSaving}>
                  Delete
                </button>
              )}
              <div className={styles.footerSpacer} />
              <button type="button" className={styles.cancelBtn} onClick={closeModal} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className={styles.saveBtn} onClick={saveDraft} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
