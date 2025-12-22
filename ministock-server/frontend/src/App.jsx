// src/App.jsx
import { useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  // null = not logged in yet
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login' or 'register'
  const [message, setMessage] = useState('');

  // Called when login succeeds in LoginPage
  function handleLoggedIn(data) {
    // you can store whatever you want here: token, email, etc.
    console.log("🟢 App: handleLoggedIn called with", data);
    setUser(data);
    console.log("🟢 App: User state updated, should switch to dashboard");
  }

  // Called to show register page
  function handleShowRegister() {
    setView('register');
    setMessage('');
  }

  // Called when registration succeeds in RegisterPage
  function handleRegistered(successMessage) {
    setView('login');
    setMessage(successMessage);
  }

  // Called to show login page
  function handleShowLogin() {
    setView('login');
    setMessage('');
  }

  // If not logged in, show the login or register page
  if (!user) {
    return (
      <div className="bubblebiz-page">
        {view === 'login' ? (
          <LoginPage onLoggedIn={handleLoggedIn} onShowRegister={handleShowRegister} message={message} />
        ) : (
          <RegisterPage onRegistered={handleRegistered} onShowLogin={handleShowLogin} />
        )}
      </div>
    );
  }

  // After login, show the dashboard
  return (
    <div className="bubblebiz-page">
      <Dashboard user={user} />
    </div>
  );
}
