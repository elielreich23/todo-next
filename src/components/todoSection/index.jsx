import React, {useState} from 'react'
// import {Form} from "../elements/Form.jsx"
import styles from './styles.module.scss'


const Todo = () => {
// const [isToggled, setIsToggled] = useState(false) 
  const [cards, setCards] = useState([]);
  const [newCardText, setNewCardText] = useState("");

  const handleAddCard = () => {
    if (newCardText.trim() !== "") {
      setCards([...cards, { id: Date.now(), text: newCardText }]);
      setNewCardText("");
    }
  };

  const handleDeleteCard = (cardId) => {
    const updatedCards = cards.filter((card) => card.id !== cardId);
    setCards(updatedCards);
  };

  return (
   <>
    {/* i want to create the card sections still didn't figure it all out  */}
    <div className={styles.card_section}>
      <h2>Card Section</h2>
      <div className={styles.cards_container}>
        {cards.map((card) => (
          <div key={card.id} className={styles.card}>
            <p>{card.text}</p>
            <button onClick={() => handleDeleteCard(card.id)}>Delete</button>
          </div>
        ))}
      </div>
     {/* <div className={styles.card_header}>
        
        <button onClick={handleAddCard}>+</button>
      </div>*/}
    </div>
   </>
  );
};


export default Todo
/*import React, { useState } from 'react';
import './style.scss';

const Todo = () => {
  const [cards, setCards] = useState([]);
  const [newCardText, setNewCardText] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formText, setFormText] = useState("");

  const handleAddCard = () => {
    if (newCardText.trim() !== "") {
      setCards([...cards, { id: Date.now(), text: newCardText }]);
      setNewCardText("");
    }
  };

  const handleDeleteCard = (cardId) => {
    const updatedCards = cards.filter((card) => card.id !== cardId);
    setCards(updatedCards);
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formText.trim() !== "") {
      setCards([...cards, { id: Date.now(), text: formText }]);
      setFormText("");
      setShowForm(false);
    }
  };

  return (
    <div className="todo-container">
      <div className="card-section">
        <h2>Card Section</h2>
        <div className="cards-container">
          {cards.map((card) => (
            <div key={card.id} className="card">
              <p>{card.text}</p>
              <button onClick={() => handleDeleteCard(card.id)}>Delete</button>
            </div>
          ))}
        </div>
        <div className="card-header">
          <button onClick={handleShowForm}>+</button>
        </div>
      </div>
      {showForm && (
        <div className="form-container">
          <form onSubmit={handleFormSubmit} className="form">
            <label htmlFor="card-text">Enter Text:</label>
            <input
              type="text"
              id="card-text"
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              autoFocus
            />
            <button type="submit">Add</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Todo;
 */