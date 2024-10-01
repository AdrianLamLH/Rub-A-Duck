import React, { useState } from "react";
import ReactFlow, { 
    Handle,
  } from 'reactflow';
const CustomNode = ({ data }) => {
    const [isDescriptionVisible, setDescriptionVisible] = useState(false);
  
    const toggleDescription = () => {
      setDescriptionVisible(!isDescriptionVisible);
    };
  
    return (
      <div
        className="bg-white border-2 border-gray-300 rounded p-2 shadow-md w-80 flex flex-col justify-between cursor-pointer"
        onClick={toggleDescription}
      >
        <Handle type="target" position="top" />
        <div className="font-bold truncate">{data.label}</div>
        {isDescriptionVisible && (
          <div className="text-sm text-gray-600">{data.description}</div>
        )}
        <div className="text-sm italic">Time: {data.estimatedTime}</div>
        <Handle type="source" position="bottom" />
      </div>
    );
  };
  
  export default CustomNode;