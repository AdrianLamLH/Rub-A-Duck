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
  const projectData = {
    task: "Develop a Web Application for Task Management",
    estimated_time: "200 hours",
    technical_description: "Create a full-stack web application using React for the frontend, Node.js with Express for the backend, and MongoDB for the database. The application will allow users to create, assign, and track tasks within projects.",
    subtasks: [
      {
        description: "Design User Interface",
        estimated_time: "40 hours",
        technical_description: "Create wireframes and high-fidelity mockups using Figma. Implement a responsive design that works well on desktop and mobile devices.",
        subtasks: [
          {
            description: "Create Wireframes",
            estimated_time: "16 hours",
            technical_description: "Develop low-fidelity wireframes for all main pages including dashboard, task list, task details, and user profile."
          },
          {
            description: "Design High-Fidelity Mockups",
            estimated_time: "24 hours",
            technical_description: "Transform wireframes into detailed, pixel-perfect designs. Include color schemes, typography, and component designs."
          }
        ]
      },
      {
        description: "Develop Frontend",
        estimated_time: "80 hours",
        technical_description: "Build the frontend using React.js with hooks for state management. Implement responsive layouts using Tailwind CSS.",
        subtasks: [
          {
            description: "Set Up React Project",
            estimated_time: "4 hours",
            technical_description: "Initialize a new React project using Create React App. Set up folder structure and install necessary dependencies."
          },
          {
            description: "Implement Core Components",
            estimated_time: "40 hours",
            technical_description: "Develop reusable React components for task lists, task items, forms, and navigation elements."
          },
          {
            description: "Implement State Management",
            estimated_time: "16 hours",
            technical_description: "Set up global state management using React Context API or Redux for handling user authentication and task data."
          },
          {
            description: "Integrate with Backend API",
            estimated_time: "20 hours",
            technical_description: "Implement API service layer to communicate with the backend. Handle data fetching, error states, and loading indicators."
          }
        ]
      },
      {
        description: "Develop Backend",
        estimated_time: "60 hours",
        technical_description: "Create a RESTful API using Node.js and Express. Implement user authentication, task CRUD operations, and integfirate with MongoDB.",
        subtasks: [
          {
            description: "Set Up Express Server",
            estimated_time: "8 hours",
            technical_description: "Initialize Node.js project, install Express, and set up basic server configuration including middleware and error handling."
          },
          {
            description: "Implement Database Schema",
            estimated_time: "12 hours",
            technical_description: "Design and implement MongoDB schemas for users, tasks, and projects using Mongoose ODM."
          },
          {
            description: "Develop API Endpoints",
            estimated_time: "32 hours",
            technical_description: "Create RESTful endpoints for user authentication, task management (CRUD operations), and project management."
          },
          {
            description: "Implement Authentication",
            estimated_time: "8 hours",
            technical_description: "Set up JWT-based authentication system. Implement user registration, login, and password reset functionalities."
          }
        ]
      },
      {
        description: "Testing and Deployment",
        estimated_time: "20 hours",
        technical_description: "Conduct thorough testing of both frontend and backend. Set up CI/CD pipeline and deploy the application to a cloud platform.",
        subtasks: [
          {
            description: "Write and Run Tests",
            estimated_time: "12 hours",
            technical_description: "Develop unit tests for backend API endpoints and frontend React components. Implement integration tests for critical user flows."
          },
          {
            description: "Set Up CI/CD Pipeline",
            estimated_time: "4 hours",
            technical_description: "Configure GitHub Actions or GitLab CI for automated testing and deployment processes."
          },
          {
            description: "Deploy to Cloud Platform",
            estimated_time: "4 hours",
            technical_description: "Deploy the frontend to Vercel or Netlify, and the backend to Heroku or AWS Elastic Beanstalk. Set up production database on MongoDB Atlas."
          }
        ]
      }
    ]
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