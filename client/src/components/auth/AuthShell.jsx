"use client";

import Link from "next/link";
import styles from "../../app/auth/auth.module.css";

/**
 * Shared two-column auth layout (matches sign-in page).
 */
export default function AuthShell({
  headline,
  paragraph,
  paragraphLink,
  paragraphLinkHref = "/auth/signin",
  paragraphLinkLabel = "Sign in",
  formTitle,
  formSubtitle,
  children,
  showTerms = true,
}) {
  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.logo}>taskers</div>
        <h1 className={styles.welcomeMessage}>{headline}</h1>
        {paragraph && (
          <p className={styles.paragraph}>
            {paragraph}
            {paragraphLink && (
              <Link href={paragraphLinkHref} className={styles.accentLink}>
                {paragraphLinkLabel}
              </Link>
            )}
          </p>
        )}
        <div className={styles.circle1} aria-hidden />
        <div className={styles.circle2} aria-hidden />
        <div className={styles.circle3} aria-hidden />
        <div className={styles.circle4} aria-hidden />
        {showTerms && (
          <div className={styles.terms}>
            <p>By using Taskero you agree to our</p>
            <p>
              <Link href="/terms">Terms of use</Link> and <Link href="/policy">policy</Link>
            </p>
          </div>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.formContainer}>
          {formTitle && <h2 className={styles.formTitle}>{formTitle}</h2>}
          {formSubtitle && <p className={styles.formSubtitle}>{formSubtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
