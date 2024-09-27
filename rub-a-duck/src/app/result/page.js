'use client'

import Link from 'next/link';
import Image from "next/image";
import rad_logo from "/rad_logo.png";
import React, { useState } from 'react';
import DynamicHeader from './components/dynamic_header';


const TaskItem = ({ task, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [showTechnical, setShowTechnical] = useState(false);

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  // Calculate indentation
  const indentationStyle = {
    paddingLeft: `${level * 2.5}rem`
  };

  return (
    <div className="mb-2">
      <div className="flex items-center" style={indentationStyle}>
        {hasSubtasks && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="mr-2 text-sm font-bold flex-shrink-0"
          >
            {isExpanded ? '▼' : '►'}
          </button>
        )}
        <h3 className="text-lg font-semibold">
          {task.description || task.task}
        </h3>
      </div>
      <div className="ml-4" style={indentationStyle}>
        <p className="text-sm text-gray-500">Estimated time: {task.estimated_time}</p>
        {task.technical_description && (
          <div className="mt-1">
            <button 
              onClick={() => setShowTechnical(!showTechnical)}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              {showTechnical ? 'Hide' : 'Show'} Technical Description
            </button>
            {showTechnical && (
              <p className="mt-1 text-sm text-gray-600">{task.technical_description}</p>
            )}
          </div>
        )}
      </div>
      {isExpanded && hasSubtasks && (
        <div className="mt-2">
          {task.subtasks.map((subtask, index) => (
            <TaskItem key={index} task={subtask} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectBreakdown = ({ projectData }) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Project Task Breakdown</h2>
      <TaskItem task={projectData} />
    </div>
  );
};

export default function Result() {
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* <header className="w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-6xl font-bold">Rub-A-Duck</h1>
          <ClickableLogo
            src={rad_logo}
            alt="Rub-A-Duck logo"
            width={180}
            height={38}
          />
        </div>
      </header> */}
      <DynamicHeader />

      <main className="flex flex-col gap-8 w-full max-w-3xl">
        <ProjectBreakdown projectData={projectData} />
      </main>

      <footer className="flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://www.github.com/adrianlamlh"
          target="_blank"
          rel="noopener noreferrer"
        >
        llam15@dons.usfca.edu
        </a>
      </footer>
    </div>
  );
}