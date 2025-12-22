import React from 'react';

export default function Toast({ type, message }) {
  if (!message) return null;

  const baseStyle = "fixed top-4 right-4 p-3 rounded-lg shadow-lg text-white font-semibold z-50 transition-all duration-300 ease-in-out transform";
  const typeStyle = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div className={`${baseStyle} ${typeStyle}`}>
      {message}
    </div>
  );
}