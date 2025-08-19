"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import './style/styles.scss';
import { useUser } from '../../contexts/UserContext';
import { useProjects } from '../../contexts/ProjectsContext';
import ProjectWizard from '../../components/ProjectWizard/ProjectWizard';

export default function Dashboard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useUser();
  const [isWhiteSidebarOpen, setIsWhiteSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProjectWizardOpen, setIsProjectWizardOpen] = useState(false);
  const { projects, tasks, selectedProjectId, selectProject, createProject } = useProjects();
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isTasksOpen, setIsTasksOpen] = useState(true);

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Determine which page is currently active
  const getActivePage = () => {
    if (pathname.includes('/profile')) return 'profile';
    if (pathname.includes('/settings')) return 'settings';
    if (pathname.includes('/statistics')) return 'statistics';
    if (pathname.includes('/calendar')) return 'calendar';
    if (pathname.includes('/uploads')) return 'uploads';
    return 'dashboard';
  };

  const activePage = getActivePage();

  const toggleWhiteSidebar = () => {
    setIsWhiteSidebarOpen(!isWhiteSidebarOpen);
  };

  const openProjectWizard = () => setIsProjectWizardOpen(true);
  const closeProjectWizard = () => setIsProjectWizardOpen(false);
  const handleCreateProject = (project) => {
    createProject({
      name: project.name,
      category: project.category,
    });
  };

  const toggleTheme = (theme) => {
    const newTheme = theme === 'dark';
    setIsDarkMode(newTheme);
    localStorage.setItem('dashboard-theme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    router.replace('/auth/signin');
  };

  const navigateTo = (page) => {
    switch (page) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'profile':
        router.push('/dashboard/profile');
        break;
      case 'settings':
        router.push('/dashboard/settings');
        break;
      case 'statistics':
        router.push('/dashboard/statistics');
        break;
      case 'calendar':
        router.push('/dashboard/calendar');
        break;
      case 'uploads':
        router.push('/dashboard/uploads');
        break;
      default:
        router.push('/dashboard');
    }
  };

  const handleLogoClick = () => {
    router.push('/dashboard');
  };

  const currentProjectId = selectedProjectId || projects[0]?.id;
  const projectTasks = tasks.filter(t => t.projectId === currentProjectId);
  const counts = {
    all: projectTasks.length,
    todo: projectTasks.filter(t => t.status === 'todo').length,
    inProgress: projectTasks.filter(t => t.status === 'in-progress').length,
    done: projectTasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className={`dashboard ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Dark Left Sidebar */}
      <div className="dark-sidebar">
        <div className="sidebar-top">
          <div className="top-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          
          {/* Logo - Clickable to go to dashboard */}
          <div className="logo" onClick={handleLogoClick}>
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h18v18H3z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M9 9h6v6H9z" fill="currentColor"/>
              </svg>
            </div>
          </div>

          <nav className="sidebar-nav">
            {/* Dashboard button - Toggles white sidebar */}
            <button 
              className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={toggleWhiteSidebar}
              title="Dashboard"
              aria-label="Dashboard"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" fill="currentColor"/>
              </svg>
            </button>

            <button 
              className={`nav-item ${activePage === 'profile' ? 'active' : ''}`}
              onClick={() => navigateTo('profile')}
              title="Profile"
              aria-label="Profile"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
              </svg>
            </button>

            <button 
              className={`nav-item ${activePage === 'calendar' ? 'active' : ''}`}
              onClick={() => navigateTo('calendar')}
              title="Calendar"
              aria-label="Calendar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="Calendar">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="currentColor"/>
              </svg>
            </button>

            <button 
              className={`nav-item ${activePage === 'statistics' ? 'active' : ''}`}
              onClick={() => navigateTo('statistics')}
              title="Statistics"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="Statistics">
                <path d="M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7-4h4v18h-4V3z" fill="currentColor"/>
              </svg>
            </button>

            <button 
              className={`nav-item ${activePage === 'uploads' ? 'active' : ''}`}
              onClick={() => navigateTo('uploads')}
              title="Uploads"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="Uploads">
                <path d="M19.35 10.04A7 7 0 005.34 8.04 5.002 5.002 0 005 18h14a4 4 0 00.35-7.96zM13 12h-2v4H8l4 4 4-4h-3v-4z" fill="currentColor"/>
              </svg>
            </button>

            <button 
              className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
              onClick={() => navigateTo('settings')}
              title="Settings"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" fill="currentColor"/>
              </svg>
            </button>

            <button className="nav-item" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5,1.5v.68C7.63,5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>
              </svg>
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item" title="Refresh">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
            </svg>
          </button>
          <button className="nav-item" onClick={handleLogout} title="Logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* White Collapsible Sidebar */}
      <div className={`white-sidebar ${isWhiteSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Projects</h2>
          <div className="header-actions">
            <button className="add-btn" onClick={openProjectWizard}>+</button>
            <button className="collapse-btn" onClick={toggleWhiteSidebar}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7 10l5 5 5-5z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="sidebar-content">
          <div className="section">
            <div className="section-header">
              <h3>Team</h3>
              <button className="expand-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          <div className={`section ${isProjectsOpen ? 'open' : ''}`}>
            <div className="section-header">
              <h3>Projects</h3>
              <button className="add-btn small" onClick={openProjectWizard}>+</button>
              <button className="expand-btn" onClick={() => setIsProjectsOpen(!isProjectsOpen)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            {isProjectsOpen && (
              <ul className="section-list">
                <li className="list-item">All projects ({projects.length})</li>
                {projects.map((p) => (
                  <li key={p.id} className={`list-item ${currentProjectId === p.id ? 'active' : ''}`} onClick={() => { selectProject(p.id); router.push(`/dashboard/projects/${p.id}`); }}>
                    <span>{p.name}</span>
                    {currentProjectId === p.id && (
                      <button className="delete-btn" title="Delete project" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this project?')) { deleteProject(p.id); } }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 7h12l-1 14H7L6 7zm3-4h6l1 2H8l1-2z" fill="currentColor"/></svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`section ${isTasksOpen ? 'open' : ''}`}>
            <div className="section-header">
              <h3>Tasks</h3>
              <button className="expand-btn" onClick={() => setIsTasksOpen(!isTasksOpen)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            {isTasksOpen && (
              <ul className="section-list">
                <li className="list-item">
                  <span>All tasks ({counts.all})</span>
                  {counts.all > 0 && currentProjectId && (
                    <button className="delete-btn" title="Delete all tasks" onClick={(e)=>{ e.stopPropagation(); if (confirm('Delete all tasks for this project?')) deleteTasksByStatus(currentProjectId, 'all'); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 7h12l-1 14H7L6 7zm3-4h6l1 2H8l1-2z" fill="currentColor"/></svg>
                    </button>
                  )}
                </li>
                <li className="list-item">
                  <span>To do ({counts.todo})</span>
                  {counts.todo > 0 && currentProjectId && (
                    <button className="delete-btn" title="Clear To do" onClick={(e)=>{ e.stopPropagation(); if (confirm('Delete all To do tasks?')) deleteTasksByStatus(currentProjectId, 'todo'); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 7h12l-1 14H7L6 7zm3-4h6l1 2H8l1-2z" fill="currentColor"/></svg>
                    </button>
                  )}
                </li>
                <li className="list-item">
                  <span>In progress ({counts.inProgress})</span>
                  {counts.inProgress > 0 && currentProjectId && (
                    <button className="delete-btn" title="Clear In progress" onClick={(e)=>{ e.stopPropagation(); if (confirm('Delete all In progress tasks?')) deleteTasksByStatus(currentProjectId, 'in-progress'); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 7h12l-1 14H7L6 7zm3-4h6l1 2H8l1-2z" fill="currentColor"/></svg>
                    </button>
                  )}
                </li>
                <li className="list-item">
                  <span>Done ({counts.done})</span>
                  {counts.done > 0 && currentProjectId && (
                    <button className="delete-btn" title="Clear Done" onClick={(e)=>{ e.stopPropagation(); if (confirm('Delete all Done tasks?')) deleteTasksByStatus(currentProjectId, 'done'); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 7h12l-1 14H7L6 7zm3-4h6l1 2H8l1-2z" fill="currentColor"/></svg>
                    </button>
                  )}
                </li>
              </ul>
            )}
          </div>

          <div className="section">
            <div className="section-header">
              <h3>Reminders</h3>
              <button className="expand-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h3>Messengers</h3>
              <button className="expand-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Theme Toggle at bottom of white sidebar */}
        <div className="theme-toggle">
          <button 
            className={`theme-btn ${!isDarkMode ? 'active' : ''}`}
            onClick={() => toggleTheme('light')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" fill="currentColor"/>
            </svg>
            Light
          </button>
          <button 
            className={`theme-btn ${isDarkMode ? 'active' : ''}`}
            onClick={() => toggleTheme('dark')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69a.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" fill="currentColor"/>
            </svg>
            Dark
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {children}
      </div>

      {/* Project Creation Wizard */}
      <ProjectWizard
        isOpen={isProjectWizardOpen}
        onClose={closeProjectWizard}
        onCreate={handleCreateProject}
      />
    </div>
  );
}


