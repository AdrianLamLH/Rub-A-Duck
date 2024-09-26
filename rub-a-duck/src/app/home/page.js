'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import rad_logo from '/rad_logo.png'; // Make sure this path is correct
import DynamicHeader from '../components/dynamic_header';


const TaskItem = ({ task, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [showTechnical, setShowTechnical] = useState(false);

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const indentationStyle = {
    paddingLeft: `${level * 1.5}rem`
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
    <div className="w-full max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Project Task Breakdown</h2>
      <TaskItem task={projectData} />
    </div>
  );
};

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setProjectData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* <header className="w-full max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl sm:text-6xl font-bold">Rub-A-Duck</h1>
          <Image
            className="dark:invert w-32 sm:w-auto"
            src={rad_logo}
            alt="Rub-A-Duck logo"
            width={180}
            height={38}
            priority
          />
        </div>
      </header> */}
      <DynamicHeader />

      <main className="w-full max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter your project idea"
              className="flex-grow p-2 border rounded"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Generate Breakdown'}
            </button>
          </div>
        </form>

        {error && (
          <div className="text-red-500 mb-4">Error: {error}</div>
        )}

        {projectData && <ProjectBreakdown projectData={projectData} />}
      </main>
    </div>
  );
}