"use client";

import React, { useCallback, useMemo, useRef, useState } from 'react';
import styles from './uploads.module.scss';

export default function UploadsPage() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progressById, setProgressById] = useState({});
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [previewById, setPreviewById] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const inputRef = useRef(null);

  const handleBrowse = () => inputRef.current?.click();

  const startFakeUpload = (file) => {
    const id = `${file.name}-${file.size}-${file.lastModified}`;
    setProgressById((p) => ({ ...p, [id]: 0 }));
    let pct = 0;
    const timer = setInterval(() => {
      pct += Math.random() * 20;
      setProgressById((p) => ({ ...p, [id]: Math.min(100, Math.round(pct)) }));
      if (pct >= 100) clearInterval(timer);
    }, 300);
  };

  const onFiles = useCallback((incoming) => {
    const fileList = Array.from(incoming);
    setFiles((prev) => [...prev, ...fileList]);
    fileList.forEach((file) => {
      startFakeUpload(file);
      // Build a lightweight preview (first ~10 lines for CSV/text)
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        const firstLines = text.split(/\r?\n/).slice(0, 10).join("\n");
        const id = `${file.name}-${file.size}-${file.lastModified}`;
        setPreviewById((m) => ({ ...m, [id]: firstLines }));
        setSelectedFileId((curr) => curr || id);
      };
      reader.readAsText(file);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  }, [onFiles]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const prettyFiles = useMemo(() => files.map((f) => ({
    id: `${f.name}-${f.size}-${f.lastModified}`,
    name: f.name,
    size: `${Math.max(1, Math.round(f.size / 1024))} KB`
  })), [files]);

  const selectedPreview = selectedFileId ? previewById[selectedFileId] : "";

  return (
    <div className={styles.uploadsPage}>
      <div className={styles.header}>
        <h1>Create or import a custom classification</h1>
        <p>Maximum file size: 50 MB • Supported format: CSV</p>
      </div>

      <div className={styles.grid}>
        <section className={styles.dropSection}>
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dragOver : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleBrowse(); }}
          >
            <div className={styles.dropInner}>
              <div className={styles.uploadIcon}>⬆</div>
              <div className={styles.dropText}>Create or import a custom classification</div>
              <div className={styles.dropSub}>Drag and drop your CSV here or</div>
              <button className={styles.primaryBtn} onClick={handleBrowse}>Browse file</button>
              <input ref={inputRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files && onFiles(e.target.files)} />
            </div>
          </div>

          {prettyFiles.length > 0 && (
            <div className={styles.uploadList}>
              {prettyFiles.map((f) => (
                <article className={`${styles.uploadItem} ${selectedFileId === f.id ? styles.uploadItemActive : ''}`} key={f.id} onClick={() => setSelectedFileId(f.id)}>
                  <div className={styles.fileBadge} />
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{f.name}</div>
                    <div className={styles.fileMeta}>{f.size}</div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${progressById[f.id] || 0}%` }} />
                    </div>
                  </div>
                  <button className={styles.deleteIconBtn} aria-label="delete" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(f.id); }}>🗑</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className={styles.previewSection}>
          <div className={styles.previewHeader}>Preview</div>
          {selectedFileId ? (
            <div className={styles.previewCard}>
              <pre className={styles.previewContent}>{selectedPreview || 'No preview available'}</pre>
            </div>
          ) : (
            <div className={styles.previewPlaceholder}>Select a file to preview its content.</div>
          )}
          <div className={styles.helpCard}>
            <button className={styles.helpHeader} onClick={() => setHelpOpen((v) => !v)}>
              <span>How to create a custom classification</span>
              <span className={styles.chevron}>{helpOpen ? '▾' : '▸'}</span>
            </button>
            {helpOpen && (
              <div className={styles.helpBody}>
                <ol>
                  <li>Use a header row for column names.</li>
                  <li>Ensure values are comma-separated.</li>
                  <li>Upload the CSV here and verify the preview.</li>
                </ol>
              </div>
            )}
          </div>
        </aside>
      </div>

      {confirmDeleteId && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDeleteId(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>Delete file?</div>
            <div className={styles.modalBody}>
              This action cannot be undone. Are you sure you want to delete this file?
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className={styles.deleteBtn} onClick={() => {
                setFiles((prev) => prev.filter((f) => `${f.name}-${f.size}-${f.lastModified}` !== confirmDeleteId));
                setSelectedFileId((id) => (id === confirmDeleteId ? null : id));
                setConfirmDeleteId(null);
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
