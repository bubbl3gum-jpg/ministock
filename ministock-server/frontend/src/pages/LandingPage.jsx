import React from "react";
import BubbleLayout from "../components/BubbleLayout";

export default function LandingPage({ onGetStarted }) {
  return (
    <BubbleLayout>
      <div className="bubble-card bubble-card-sm">
        <h1 className="text-3xl font-extrabold text-sky-500 mb-3">
          BubbleBiz
        </h1>
        <p className="text-gray-500 mb-6">
          Effortless inventory management for small businesses.
          <br />
          Stay organized, save time, and grow!
        </p>

        <button className="bubble-btn" onClick={onGetStarted}>
          Get Started
        </button>
      </div>
    </BubbleLayout>
  );
}