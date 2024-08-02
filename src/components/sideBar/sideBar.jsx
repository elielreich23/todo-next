"use client"
import styles from "./styles.module.scss";
import { iconData } from "./iconData";
import { useState } from "react";
import PopupForm from "../popUpForm/form";
import Todo from "../todoSection/index";

const Sidebar = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => {
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <>
      <div className={styles.sideContainer}>
        <div className={styles.blackpane}>
          {iconData.map((x) => {
            return (
              <image src={x.url} alt={x.altText} title={x.title} key={x.title} />
            );
          })}
        </div>
        <div className={styles.whitepane}>
          <div className={styles.whitepane_heading}>
            <h1>Projects</h1>
            <div className={styles.plus} onClick={openPopup}>+</div>
          </div>
          <Dropdown name={"Team"} className={styles.drop}></Dropdown>
          <Dropdown name={"Projects"} className={styles.drop}>
            <div className={styles.listStyle}>
              <image className={styles.lines} src="/assets/Lines.svg" alt="" />
              <ul>
                <li className={styles.first}>All projects</li>
                <li className={styles.second}>Design System</li>
                <li className={styles.third}>User flow</li>
                <li className={styles.fourth}>Ux research</li>
              </ul>
            </div>
          </Dropdown>
          <Dropdown name={"Tasks"} className={styles.drop}>
          <div className={styles.listStyle}>
              <image className={styles.lines} src="/assets/Lines.svg" alt="" />
              <ul>
                <li className={styles.first}>All tasks</li>
                <li className={styles.second}>To do</li>
                <li className={styles.third}>In progress</li>
                <li className={styles.fourth}>Done</li>
              </ul>
            </div>
          </Dropdown>
          <Dropdown name={"Reminders"} className={styles.drop}></Dropdown>
          <Dropdown name={"Messengers"} className={styles.drop}></Dropdown>
        </div>
        {/* 
        add style for logout button
        <div className="logout">
          <img classname="log-btn" src="/assets/log.svg" alt="" />
        </div> */}
      </div>
      {isPopupOpen && (
        <PopupForm onClose={closePopup} />
      )}
      <Todo/>
    </>
  );
};

export default Sidebar;

export function Dropdown({ name, children, className }) {
  const [openDrop, setOpenDrop] = useState(false);
  function handledrop() {
    setOpenDrop(!openDrop);
  }
  return (
    <>
      <div className={className} onClick={handledrop}>
        <div className={styles.droptext}>{name}</div>
        <image
          src={openDrop ? "/assets/arrowdown.svg" : "/assets/arrowside.svg"}
          alt="arrow"
        />
      </div>
      {openDrop && children}
    </>
  );
}
