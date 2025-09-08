"use client";

import React, { useState } from 'react';
import styles from '../style/settings.module.scss';

const plans = [
  { id: 'basic', name: 'Basic Plan - $9/month', subtitle: 'Up to 10 users, 20GB per user' },
  { id: 'business', name: 'Business Plan - $19/month', subtitle: 'Up to 20 users, 40GB per user' },
  { id: 'enterprise', name: 'Enterprise Plan - $29/month', subtitle: 'Unlimited users, 50GB per user' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState('basic');

  return (
    <div className={styles.settingsPage}>
      <div className={styles.pageHeader}>
        <h1>Settings</h1>
        <div className={styles.tabs}>
          {['Basic Info', 'Plans & Billing', 'Team', 'Appearance', 'Notifications', 'Audit Trail', 'Integrations'].map((t) => (
            <button key={t} className={`${styles.tabBtn} ${t === 'Plans & Billing' ? styles.active : ''}`} onClick={() => setActiveTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.panel}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>Plans & Billing</div>
          <div className={styles.cardSub}>Manage your subscription plan and billing details</div>

          <div className={styles.planList}>
            {plans.map((p) => (
              <label key={p.id} className={`${styles.planRow} ${selectedPlan === p.id ? styles.planActive : ''}`}>
                <input type="radio" name="plan" checked={selectedPlan === p.id} onChange={() => setSelectedPlan(p.id)} />
                <div className={styles.planBody}>
                  <div className={styles.planName}>{p.name}</div>
                  <div className={styles.planSubtitle}>{p.subtitle}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>Card Details</div>
          <div className={styles.cardSub}>Update your card details.</div>

          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
            <label className={styles.field}>
              <span>Name on card</span>
              <input placeholder="Anna Taylor" />
            </label>

            <div className={styles.row3}>
              <label className={styles.field}>
                <span>Card number</span>
                <input placeholder="1234 5678 9876 5432" />
              </label>
              <label className={styles.field}>
                <span>Exp Date</span>
                <input placeholder="05/27" />
              </label>
              <label className={styles.field}>
                <span>CVV</span>
                <input placeholder="***" />
              </label>
            </div>

            <label className={styles.field}>
              <span>Billing Address</span>
              <input placeholder="Beyond Avenue 46" />
            </label>

            <div className={styles.formFooter}>
              <button className={styles.primaryBtn}>Save changes</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
