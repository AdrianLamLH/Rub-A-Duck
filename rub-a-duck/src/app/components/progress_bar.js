import React from 'react';

const ProgressBar = ({ currentDepth, maxDepth }) => {
    const progressPercentage = (currentDepth / maxDepth) * 100;
  
    return (
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-blue-500 h-4 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    );
  };
  
  export default ProgressBar;