"use client";

import React from 'react';
import styles from '../WizardModal/wizardModal.module.scss';

export default function TaskCommentsEditor({
  comments,
  newComment,
  onNewCommentChange,
  onAddComment,
  onRemoveComment,
  title = 'Comments',
  description = 'Add comments or notes for this task.',
}) {
  return (
    <div className={styles.commentsSection}>
      <h3>{title}</h3>
      <p className={styles.commentsInfo}>{description}</p>

      <div className={styles.commentInputGroup}>
        <textarea
          className={styles.commentTextarea}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => onNewCommentChange(e.target.value)}
          rows={3}
        />
        <button
          type="button"
          className={styles.addCommentBtn}
          onClick={onAddComment}
          disabled={!newComment.trim()}
        >
          Add Comment
        </button>
      </div>

      {comments.length > 0 && (
        <div className={styles.commentsList}>
          <h4>Comments ({comments.length})</h4>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentInfo}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>{comment.author}</span>
                  <span className={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.commentText}>{comment.text}</div>
              </div>
              <button
                type="button"
                className={styles.removeCommentBtn}
                onClick={() => onRemoveComment(comment.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
