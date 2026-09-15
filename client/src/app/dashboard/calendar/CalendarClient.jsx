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

// Shared draft shape for both task-backed calendar items and standalone custom events.
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
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date(2024, month, 1))
);

// Date/search helpers normalize FullCalendar values and make fuzzy calendar search forgiving.
const toLocalDate = (date) => {
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const normalizeSearch = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = Array.from({ length: a.length + 1 }, (_, index) => index);
  for (let j = 1; j <= b.length; j += 1) {
    let prev = j - 1;
    rows[0] = j;
    for (let i = 1; i <= a.length; i += 1) {
      const current = rows[i];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i] = Math.min(rows[i] + 1, rows[i - 1] + 1, prev + cost);
      prev = current;
    }
  }
  return rows[a.length];
};

const isSubsequence = (haystack, needle) => {
  let index = 0;
  for (const char of haystack) {
    if (char === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
};

const tokenMatches = (haystack, token) => {
  if (!token) return true;
  if (haystack.includes(token)) return true;
  if (token.length >= 4 && isSubsequence(haystack.replace(/\s+/g, ""), token.replace(/\s+/g, ""))) return true;

  const words = haystack.split(" ");
  const maxDistance = token.length <= 4 ? 1 : 2;
  return words.some((word) => {
    if (!word) return false;
    if (word.startsWith(token) || (token.startsWith(word) && word.length >= 3)) return true;
    return Math.abs(word.length - token.length) <= maxDistance && levenshtein(word, token) <= maxDistance;
  });
};

const formatEventDates = (value) => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return [];
  return [
    toLocalDate(date),
    new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(date),
    new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date),
    new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date),
    new Intl.DateTimeFormat(undefined, { month: "long" }).format(date),
  ];
};

const matchesQuery = (event, query) => {
  const tokens = normalizeSearch(query).split(" ").filter(Boolean);
  if (!tokens.length) return true;
  const haystack = normalizeSearch(
    [
      event.title,
      event.extendedProps?.description,
      event.extendedProps?.project,
      event.extendedProps?.guests,
      event.extendedProps?.status,
      event.extendedProps?.priority,
      event.extendedProps?.source,
      ...formatEventDates(event.start),
    ]
      .filter(Boolean)
      .join(" ")
  );
  return tokens.every((token) => tokenMatches(haystack, token));
};

// Month picker helpers build the compact date chooser used in the custom calendar header.
const buildMonthCells = (cursor) => {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let index = 0; index < firstDay; index += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

function MonthPicker({ selectedDate, onSelect }) {
  // Local cursor lets users browse months/years before committing a date to the calendar.
  const [cursor, setCursor] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const todayKey = toLocalDate(new Date());
  const selectedKey = toLocalDate(selectedDate);
  const setCursorMonth = (month) => setCursor(new Date(cursor.getFullYear(), Number(month), 1));
  const setCursorYear = (year) => {
    const nextYear = Number(year);
    if (!Number.isInteger(nextYear) || nextYear < 1900 || nextYear > 9999) return;
    setCursor(new Date(nextYear, cursor.getMonth(), 1));
  };

  return (
    <div className={styles.monthPicker} role="dialog" aria-label="Choose a date">
      <div className={styles.monthPickerHeader}>
        <select
          value={cursor.getMonth()}
          onChange={(event) => setCursorMonth(event.target.value)}
          aria-label="Calendar month"
        >
          {MONTH_NAMES.map((month, index) => (
            <option key={month} value={index}>
              {month}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1900"
          max="9999"
          value={cursor.getFullYear()}
          onChange={(event) => setCursorYear(event.target.value)}
          aria-label="Calendar year"
        />
      </div>
      <div className={styles.monthPickerWeekdays}>
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className={styles.monthPickerGrid}>
        {buildMonthCells(cursor).map((date, index) => {
          if (!date) return <span key={`empty-${index}`} className={styles.monthPickerEmpty} />;
          const key = toLocalDate(date);
          const className = [
            styles.monthPickerDay,
            key === todayKey ? styles.monthPickerToday : "",
            key === selectedKey ? styles.monthPickerSelected : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button key={key} type="button" className={className} onClick={() => onSelect(date)}>
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Event mapping helpers translate API tasks/events into the single shape FullCalendar expects.
const toLocalTime = (date, fallback = "09:30") => {
  if (!date) return fallback;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const buildDate = (date, time) => new Date(`${date}T${time || "00:00"}:00`);

const formatDurationLabel = (date, startTime, endTime) => {
  if (!date || !startTime || !endTime) return "";
  const start = buildDate(date, startTime);
  let end = buildDate(date, endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  if (end <= start) end = new Date(start.getTime() + 30 * 60 * 1000);
  const minutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours && remainder) return `${hours}h ${remainder}m`;
  if (hours) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${remainder} min`;
};

const withTimeRange = (startValue, endValue) => {
  const start = startValue instanceof Date ? startValue : startValue ? new Date(startValue) : null;
  if (!start || Number.isNaN(start.getTime())) return { start: null, end: null };
  let end = endValue instanceof Date ? endValue : endValue ? new Date(endValue) : null;
  if (!end || Number.isNaN(end.getTime()) || end <= start) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  return { start, end };
};

const taskColor = (task) => {
  if (task.status === "completed") return "#BBF7D0";
  if (task.priority === "high") return "#FECACA";
  if (task.priority === "low") return "#BAE6FD";
  return "#DBEAFE";
};

const mapTaskToEvent = (task) => {
  const { start, end } = withTimeRange(task.due_date, task.end_date);
  return {
    id: `task-${task.id}`,
    title: task.title,
    start: start?.toISOString(),
    end: end?.toISOString(),
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
  };
};

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
  // Calendar state tracks fetched items, toolbar controls, modal drafts, and save feedback.
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState("timeGridWeek");
  const [query, setQuery] = useState("");
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const calendarRef = useRef(null);
  const monthPickerWrapRef = useRef(null);
  const lastSearchJump = useRef("");

  // Load tasks, custom events, and projects together so calendar creation has all needed metadata.
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

  // Close the date picker from outside clicks or Escape without affecting the main calendar.
  useEffect(() => {
    if (!isMonthPickerOpen) return undefined;
    const onPointerDown = (event) => {
      if (!monthPickerWrapRef.current?.contains(event.target)) setIsMonthPickerOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsMonthPickerOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMonthPickerOpen]);

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingEventId(null);
    setFeedback("");
  };

  // Create/edit entry points convert calendar selections or clicked events into editable drafts.
  const openDraftForSelection = (selectionInfo) => {
    resetDraft();
    const fallbackProject = projects[0]?.id ? String(projects[0].id) : "";
    setDraft({
      ...emptyDraft,
      date: toLocalDate(selectionInfo.start),
      startTime: toLocalTime(selectionInfo.start),
      endTime: toLocalTime(
        selectionInfo.end,
        toLocalTime(new Date((selectionInfo.start?.getTime?.() || Date.now()) + 60 * 60 * 1000), "10:30")
      ),
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
      endTime: toLocalTime(event.end, toLocalTime(new Date((event.start?.getTime() || Date.now()) + 60 * 60 * 1000), "10:00")),
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

  // Dragging or resizing an item updates the correct backend resource, then reloads canonical data.
  const updateEventDate = async (changeInfo) => {
    const source = changeInfo.event.extendedProps?.source;
    const start = changeInfo.event.start?.toISOString();
    const end = changeInfo.event.end?.toISOString() || start;

    try {
      if (source === "task") {
        await api(API_ENDPOINTS.TASKS.DETAIL(changeInfo.event.extendedProps.taskId), {
          method: "PUT",
          body: JSON.stringify({ due_date: start, end_date: end }),
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

  // Search filters locally and sorts results so jump-to-match behavior is predictable.
  const filteredEvents = useMemo(() => {
    const matched = query.trim() ? events.filter((event) => matchesQuery(event, query)) : events;
    return [...matched].sort((left, right) => new Date(left.start) - new Date(right.start));
  }, [events, query]);

  const goToDate = useCallback((date) => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.gotoDate(date);
    setVisibleDate(date);
    setIsMonthPickerOpen(false);
  }, []);

  // When a search narrows results, jump to the first upcoming match after a short debounce.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      lastSearchJump.current = "";
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      const signature = `${trimmed}|${filteredEvents.map((event) => event.id).join(",")}`;
      if (signature === lastSearchJump.current) return;

      const now = Date.now();
      const upcoming = filteredEvents.find((event) => new Date(event.start).getTime() >= now);
      const matchStart = (upcoming || filteredEvents[0])?.start;
      if (!matchStart) return;

      lastSearchJump.current = signature;
      const nextDate = matchStart instanceof Date ? matchStart : new Date(matchStart);
      if (Number.isNaN(nextDate.getTime())) return;
      calendarRef.current?.getApi()?.gotoDate(nextDate);
      setVisibleDate(nextDate);
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [filteredEvents, query]);

  // Persist the modal draft as either a task or a standalone event based on the selected type.
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
      let createdEvent = null;

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
          end_date: end.toISOString(),
          project: Number(draft.projectId),
        };

        const taskId = editingEventId?.startsWith("task-") ? Number(editingEventId.replace("task-", "")) : null;

        // Optimistic UI update
        const optimisticEvent = {
          id: `task-temp-${Date.now()}`,
          title: payload.title,
          start: payload.due_date,
          end: payload.end_date,
          backgroundColor: taskColor({ status: payload.status, priority: payload.priority }),
          borderColor: "transparent",
          extendedProps: {
            source: "task",
            taskId: `temp-${Date.now()}`,
            projectId: payload.project,
            status: payload.status,
            priority: payload.priority,
            description: payload.description,
            project: projects.find((p) => String(p.id) === String(payload.project))?.name || "",
          },
        };
        setEvents((prev) => [...prev.filter(e => e.id !== editingEventId), optimisticEvent]);

        const response = await api(taskId ? API_ENDPOINTS.TASKS.DETAIL(taskId) : API_ENDPOINTS.TASKS.LIST, {
          method: taskId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        });
        createdEvent = response;
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

        // Optimistic UI update
        const optimisticEvent = {
          id: `event-temp-${Date.now()}`,
          title: payload.title,
          start: payload.start,
          end: payload.end,
          backgroundColor: payload.color || "#DBEAFE",
          borderColor: "transparent",
          extendedProps: {
            source: "custom",
            eventId: `temp-${Date.now()}`,
            link: payload.link,
            guests: payload.guests,
            description: payload.description,
          },
        };
        setEvents((prev) => [...prev.filter(e => e.id !== editingEventId), optimisticEvent]);

        const response = await api(eventId ? API_ENDPOINTS.CALENDAR.EVENT_DETAIL(eventId) : API_ENDPOINTS.CALENDAR.EVENTS, {
          method: eventId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        });
        createdEvent = response;
      }

      setIsModalOpen(false);
      resetDraft();
      // Load in background
      loadCalendarData().catch(console.error);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to save calendar item.");
    } finally {
      setIsSaving(false);
    }
  };

  // Only standalone custom events can be deleted here; task deletion stays in task workflows.
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
      {eventInfo.timeText ? <span className={styles.eventTime}>{eventInfo.timeText}</span> : null}
      <span className={styles.eventSource}>
        {eventInfo.event.extendedProps?.source === "task" ? "Task" : "Event"}
      </span>
      <span className={styles.eventTitle}>{eventInfo.event.title}</span>
    </div>
  );

  return (
    <div className={styles.calendarWrapper}>
      {/* Calendar toolbar: date picker, item creation, view tabs, and fuzzy search. */}
      <div className={styles.headerBar}>
        <div className={styles.leftControls}>
          <div className={styles.monthPickerWrap} ref={monthPickerWrapRef}>
            <button
              type="button"
              className={`${styles.monthTitle} ${isMonthPickerOpen ? styles.monthTitleOpen : ""}`}
              onClick={() => setIsMonthPickerOpen((open) => !open)}
              aria-expanded={isMonthPickerOpen}
              aria-haspopup="dialog"
            >
              {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(visibleDate)}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            {isMonthPickerOpen && <MonthPicker selectedDate={visibleDate} onSelect={goToDate} />}
          </div>
        </div>
        <div className={styles.rightControls}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => {
              const start = new Date();
              openDraftForSelection({ start, end: new Date(start.getTime() + 60 * 60 * 1000) });
            }}
          >
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
          <label className={styles.searchWrap}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search tasks, projects, or dates"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search calendar"
            />
          </label>
        </div>
      </div>

      {feedback && <div className={styles.inlineAlert}>{feedback}</div>}

      {/* FullCalendar owns grid interactions; local handlers bridge those interactions to API state. */}
      <FullCalendar
        plugins={calendarPlugins}
        initialView="timeGridWeek"
        headerToolbar={false}
        events={filteredEvents}
        select={openDraftForSelection}
        eventClick={openDraftForEvent}
        editable
        selectable
        selectMirror
        nowIndicator
        eventResizableFromStart
        forceEventDuration
        defaultTimedEventDuration="01:00:00"
        displayEventEnd
        eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
        eventDrop={updateEventDate}
        eventResize={updateEventDate}
        ref={calendarRef}
        viewDidMount={(arg) => setView(arg.view.type)}
        datesSet={(arg) => {
          setView(arg.view.type);
          setVisibleDate(arg.view.calendar.getDate());
        }}
        eventContent={renderEventContent}
        eventClassNames={() => ""}
      />

      {/* Add/edit modal shares one form for tasks and custom events, with type-specific fields. */}
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
                  <span>Start</span>
                  <input
                    type="time"
                    value={draft.startTime}
                    onChange={(event) => setDraft({ ...draft, startTime: event.target.value })}
                  />
                </div>
                <div className={styles.timeField}>
                  <span>End</span>
                  <input
                    type="time"
                    value={draft.endTime}
                    onChange={(event) => setDraft({ ...draft, endTime: event.target.value })}
                  />
                </div>
              </div>
              {draft.type === "task" && formatDurationLabel(draft.date, draft.startTime, draft.endTime) ? (
                <p className={styles.durationHint}>
                  Duration: {formatDurationLabel(draft.date, draft.startTime, draft.endTime)}
                </p>
              ) : null}

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
