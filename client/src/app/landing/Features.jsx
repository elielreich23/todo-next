"use client";

import React from 'react';

const Features = () => {
  return (
    <div className="container">
      <h2 className="sectionTitle">
        Redefining <span className="highlight">Seamless</span> Task Management
      </h2>
      <p className="sectionDescription">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
      
      <h3 className="featuresTitle">Key <span className="highlight">features</span></h3>
      
      <div className="featureCards">
        <div className="featureCard">
          <div className="cardContent">
            <p className="cardText">
              ssist in getting tasks done.
            </p>
            <button className="viewMore">View more</button>
          </div>
        </div>
        
        <div className="featureCard">
          <div className="cardContent">
            <h4 className="cardTitle">Fast documentation</h4>
            <p className="cardDescription">
              Lorem ipsum dolor et laran in the frame, follow up on team and developmental tasks
            </p>
            <div className="projectSection">
              <h5 className="projectTitle">Mandem Project</h5>
              <p className="projectDescription">
                Building a web3 mobile application project
              </p>
            </div>
            <div className="teamSection">
              <div className="teamAvatars">
                <div className="avatar"></div>
                <div className="avatar"></div>
                <div className="avatar"></div>
                <div className="avatar"></div>
                <div className="avatar"></div>
              </div>
              <p className="newMessages">+21 new message</p>
              <button className="sendMessage">
                Send a message
                <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="featureCard">
          <div className="cardContent">
            <h4 className="cardTitle">Lorem ipsum</h4>
            <p className="cardDescription">
              Our app have built-in AI features to
            </p>
            <div className="aiFeatures">
              <h5 className="aiTitle">AI features</h5>
              <ul className="aiList">
                <li>
                  <span className="aiIcon">📧</span>
                  Schedule Email
                </li>
                <li>
                  <span className="aiIcon">💬</span>
                  Auto-Message
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="createTaskSection">
        <button className="createTask">
          Create Task
          <svg className="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Features;
