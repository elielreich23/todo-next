"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "../../../constants";
import { api } from "../../../lib/api";
import { getAccessToken } from "../../../utils/storage";
import styles from "./uploads.module.scss";

const formatSize = (bytes = 0) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

const normalizeUpload = (upload) => ({
  id: String(upload.id),
  name: upload.name,
  size: upload.file_size,
  type: upload.file_type,
  url: upload.file_url,
  preview: upload.preview || "",
  createdAt: upload.created_at,
});

export default function UploadsPage() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progressById, setProgressById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [previewById, setPreviewById] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const inputRef = useRef(null);

  const handleBrowse = () => inputRef.current?.click();

  useEffect(() => {
    let isCancelled = false;

    const loadUploads = async () => {
      try {
        setIsLoading(true);
        const response = await api(API_ENDPOINTS.UPLOADS.LIST);
        if (isCancelled) return;

        const uploads = response.success ? response.uploads.map(normalizeUpload) : [];
        setFiles(uploads);
        setPreviewById(Object.fromEntries(uploads.map((upload) => [upload.id, upload.preview])));
        setSelectedFileId((current) => current || uploads[0]?.id || null);
      } catch (err) {
        if (!isCancelled) {
          setError(err?.message || "Failed to load uploads");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadUploads();
    return () => {
      isCancelled = true;
    };
  }, []);

  const onFiles = useCallback((incoming) => {
    const fileList = Array.from(incoming || []);
    setError("");

    fileList.forEach(async (file) => {
      const tempId = `${file.name}-${file.size}-${file.lastModified}`;
      const optimisticFile = {
        id: tempId,
        name: file.name,
        size: file.size,
        type: file.type,
      };

      setFiles((prev) => [optimisticFile, ...prev]);
      setProgressById((prev) => ({ ...prev, [tempId]: 35 }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);

        const token = getAccessToken();
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOADS.LIST}`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Upload failed");
        }

        const uploadedFile = normalizeUpload(data.upload);
        setFiles((prev) => [uploadedFile, ...prev.filter((item) => item.id !== tempId)]);
        setPreviewById((prev) => ({ ...prev, [uploadedFile.id]: uploadedFile.preview }));
        setProgressById((prev) => ({ ...prev, [uploadedFile.id]: 100 }));
        setSelectedFileId(uploadedFile.id);
      } catch (err) {
        setFiles((prev) => prev.filter((item) => item.id !== tempId));
        setError(err?.message || "Upload failed");
      } finally {
        setProgressById((prev) => {
          const next = { ...prev };
          delete next[tempId];
          return next;
        });
      }
    });
  }, []);

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

  const prettyFiles = useMemo(() => files.map((file) => ({
    id: file.id,
    name: file.name,
    size: formatSize(file.size),
    url: file.url,
  })), [files]);

  const selectedPreview = selectedFileId ? previewById[selectedFileId] : "";

  const deleteUpload = async () => {
    if (!confirmDeleteId) return;

    try {
      await api(API_ENDPOINTS.UPLOADS.DETAIL(Number(confirmDeleteId)), { method: "DELETE" });
      setFiles((prev) => prev.filter((file) => file.id !== confirmDeleteId));
      setSelectedFileId((id) => (id === confirmDeleteId ? null : id));
    } catch (err) {
      setError(err?.message || "Failed to delete upload");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className={styles.uploadsPage}>
      <div className={styles.header}>
        <h1>Create or import a custom classification</h1>
        <p>Maximum file size: 50 MB - Supported format: CSV</p>
      </div>

      {error && <div className={styles.previewPlaceholder}>{error}</div>}

      <div className={styles.grid}>
        <section className={styles.dropSection}>
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dragOver : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") handleBrowse(); }}
          >
            <div className={styles.dropInner}>
              <div className={styles.uploadIcon}>^</div>
              <div className={styles.dropText}>Create or import a custom classification</div>
              <div className={styles.dropSub}>Drag and drop your CSV here or</div>
              <button className={styles.primaryBtn} onClick={handleBrowse}>Browse file</button>
              <input ref={inputRef} type="file" accept=".csv,text/csv,text/plain" hidden onChange={(e) => e.target.files && onFiles(e.target.files)} />
            </div>
          </div>

          {prettyFiles.length > 0 && (
            <div className={styles.uploadList}>
              {prettyFiles.map((file) => (
                <article
                  className={`${styles.uploadItem} ${selectedFileId === file.id ? styles.uploadItemActive : ""}`}
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                >
                  <div className={styles.fileBadge} />
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileMeta}>{file.size}</div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${progressById[file.id] || 100}%` }} />
                    </div>
                  </div>
                  <button
                    className={styles.deleteIconBtn}
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(file.id);
                    }}
                  >
                    x
                  </button>
                </article>
              ))}
            </div>
          )}

          {!isLoading && prettyFiles.length === 0 && (
            <div className={styles.previewPlaceholder}>No uploads yet. Add a CSV to store it with your account.</div>
          )}
        </section>

        <aside className={styles.previewSection}>
          <div className={styles.previewHeader}>Preview</div>
          {selectedFileId ? (
            <div className={styles.previewCard}>
              <pre className={styles.previewContent}>{selectedPreview || "No preview available"}</pre>
            </div>
          ) : (
            <div className={styles.previewPlaceholder}>Select a file to preview its content.</div>
          )}
          <div className={styles.helpCard}>
            <button className={styles.helpHeader} onClick={() => setHelpOpen((value) => !value)}>
              <span>How to create a custom classification</span>
              <span className={styles.chevron}>{helpOpen ? "v" : ">"}</span>
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
              <button className={styles.deleteBtn} onClick={deleteUpload}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
