"use client";

import dynamic from "next/dynamic";

const CalendarClient = dynamic(() => import("./CalendarClient"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          animation: "calendar-spin 1s linear infinite",
          margin: "0 auto 20px",
        }}
      />
      <p>Loading calendar...</p>
      <style jsx global>{`
        @keyframes calendar-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  ),
});

export default function CalendarPage() {
  return <CalendarClient />;
}
