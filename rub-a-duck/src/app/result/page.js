'use client'

import Link from 'next/link';
import Image from "next/image";
// import rad_logo from "/rad_logo.png";
import React, { useState, useEffect } from 'react';
import DynamicHeader from '../components/dynamic_header';
import ProgressBar from '../components/progress_bar';

// Component to render individual task items
const TaskItem = ({ task, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [showTechnical, setShowTechnical] = useState(false);

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  // Calculate indentation based on the task level
  const indentationStyle = {
    paddingLeft: `${level * 2.5}rem`
  };

  return (
    <div className="mb-2">
      {/* Task header with expand/collapse button and description */}
      <div className="flex items-center justify-between" style={indentationStyle}>
        <div className="flex items-center flex-grow mr-2 min-w-0">
          {hasSubtasks && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="mr-2 text-sm font-bold flex-shrink-0"
            >
              {isExpanded ? '▼' : '►'}
            </button>
          )}
          <h3 className="text-lg font-semibold truncate">
            {task.description || task.task}
          </h3>
        </div>
        {/* Toggle button for technical description */}
        {task.technical_description && (
          <button 
            onClick={() => setShowTechnical(!showTechnical)}
            className="ml-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex-shrink-0"
          >
            {showTechnical ? 'Hide' : 'Show'} Technical
          </button>
        )}
      </div>
      {/* Task details including estimated time and technical description */}
      <div className="ml-4" style={indentationStyle}>
        <p className="text-sm text-gray-500">Estimated time: {task.estimated_time}</p>
        {showTechnical && task.technical_description && (
          <p className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">{task.technical_description}</p>
        )}
      </div>
      {/* Render subtasks recursively if expanded */}
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

// Component to render the entire project breakdown
const ProjectBreakdown = ({ projectData }) => {
  // Create a unique identifier based on project attributes
  const projectIdentifier = btoa(JSON.stringify({
    description: projectData.description,
    technical_description: projectData.technical_description,
    estimatedTime: projectData.estimated_time,
  }));

  // Store the full project data in sessionStorage
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('currentProjectData', JSON.stringify(projectData));
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Project Task Breakdown</h2>
      <TaskItem task={projectData} />
      <Link
        href={{
          pathname: '/graph_vis',
          query: { project: projectIdentifier },
        }}
      >
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Go to Graph Visualization
        </button>
      </Link>
    </div>
  );
};

// Main component for the result page
export default function Result() {
  const [projectData, setProjectData] = useState(null);
  const [progress, setProgress] = useState({ current_depth: 0, max_depth: 3 });
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  // Function to fetch data with retry logic
  const fetchData = async (retryCount = 0) => {
    try {
      console.log(`${process.env.NEXT_PUBLIC_API_URL}`)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch data');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Retry attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchData(retryCount + 1);
      }
      throw err;
    }
  };

  // Function to fetch project data
  const fetchProjectData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching project data...');
      const data = await fetchData();
      console.log('Received project data:', data);
      setProjectData(data.task_breakdown);
    } catch (error) {
      console.error('Error fetching project data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch progress data
  const fetchProgress = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/progress`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received progress data:', data);
      setProgress(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  // Effect to poll for progress updates while loading
  useEffect(() => {
    let intervalId;
    if (isLoading) {
      intervalId = setInterval(fetchProgress, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading]);

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <DynamicHeader />

      <main className="flex flex-col gap-8 w-full max-w-3xl">
        {/* Query input and submit button */}
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your project query"
            className="w-full p-2 border border-gray-300 rounded"
          />
          <button
            onClick={fetchProjectData}
            disabled={isLoading}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Loading...' : 'Generate Project Breakdown'}
          </button>
        </div>

        {/* Progress bar */}
        {isLoading && <ProgressBar currentDepth={progress.current_depth} maxDepth={progress.max_depth} />}
        
        {/* Error message */}
        {error && <p className="text-red-500 mb-4">Error: {error}</p>}
        
        {/* Project breakdown or loading message */}
        {isLoading ? (
          <p>Loading project data...</p>
        ) : projectData ? (
          <ProjectBreakdown projectData={projectData} />
        ) : (
          <p>No project data available. Enter a query and click the button to generate.</p>
        )}
      </main>

      {/* Footer */}
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