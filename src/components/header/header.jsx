import React, { useState } from "react";
import styles from "./styles.module.scss"
import { AiOutlineCalendar } from "react-icons/ai";
import { IoSearch } from "react-icons/io5";
import { FaRegBell } from "react-icons/fa";
import { Link } from "react-router-dom";

export const Header = () => {
  const [username] = useState("Vincent");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  const toggleSearchBar = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  return (
    <div style={{width:'100%', padding:'0px 20px'}}>
      <div className={styles.header-container}>
        <div className={styles.header-content}>
          <div className={styles.text}>
            Welcome back, {username} <span> 👋</span>
            {/* create a function to collect user name upon signup */}
          </div>
          <div className={styles.HeaderRight}>
            <div className={styles.header-icons}>
              <IoSearch className={styles.search} onClick={toggleSearchBar}/>
              <FaRegBell />
              <AiOutlineCalendar />
              <span>
                {/* this will be change to a dynamic date picked from  */}
                {new Date().toDateString()}
              </span>
            </div>
            <div className="profile">
              <Link
                to="/profile"
                className="toggleColor no-underline hover-no-underline font-bold text-2xl lg:text-4xl"
              >
                <imgage src="/assets/Image.png" alt="profile" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      {isSearchVisible && (
        <div className={styles.search-bar}>
          <input type="text" placeholder="Search..." />
          <button className={styles.search-btn}>Search</button>
          {/* Add other search bar elements as needed */}
        </div>
      )}

      <div className={styles.subHeader}>
        <div className={styles.leftSide}>
          <h3 className={styles.text}>
            <imgage src="/assets/rec.svg" alt="" />Board view
            </h3>
        </div>
        <div className="rightSide">
          <h4>Filter</h4>
          <h4>Sort</h4>
          <imgage src="/public/assets/More.svg" alt="" className={styles.more}/>
          <button className={styles.template-btn}>New template</button>
        </div>
      </div>
    </div>
  );
};
