import React from "react";

export default function BubbleLayout({ children, className }) {
  return (
    <div className={`bubble-root ${className || ''}`}>
      {/* Background Bubbles */}
      <div className="bubbles">
        <div className="bubble bubble1"></div>
        <div className="bubble bubble2"></div>
        <div className="bubble bubble3"></div>
        <div className="bubble bubble4"></div>
      </div>

      {/* Main Content Area */}
      {/* The actual card will be inside children, so this is just the centered flex container */}
      <div className="bubble-content-wrapper">
        {children}
      </div>
    </div>
  );
}