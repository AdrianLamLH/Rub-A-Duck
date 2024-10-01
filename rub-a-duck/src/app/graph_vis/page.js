'use client'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import rad_logo from '/rad_logo.png'; // Make sure this path is correct
import DynamicHeader from '../components/dynamic_header';
import { useSearchParams } from 'next/navigation'

export default function Graph_Vis() {
  const [projectData, setProjectData] = useState(null);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const projectIdentifier = searchParams.get('project');
    if (projectIdentifier) {
      retrieveProjectData(projectIdentifier);
    }
  }, [searchParams]);

  const retrieveProjectData = (identifier) => {
    try {
      if (typeof window !== 'undefined') {
        const storedData = sessionStorage.getItem('currentProjectData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const storedIdentifier = btoa(JSON.stringify({
            description: parsedData.description || parsedData.task,
            estimatedTime: parsedData.estimated_time,
            // Add more unique attributes if available
          }));

          if (storedIdentifier === identifier) {
            setProjectData(parsedData);
            return;
          }
        }
      }
      
      // If we couldn't retrieve from storage or identifiers don't match
      setError("Project data not found. You may need to regenerate the project breakdown.");
    } catch (err) {
      setError("Error retrieving project data: " + err.message);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <DynamicHeader />

      <main className="w-full max-w-3xl mx-auto">
        {error && (
          <div className="text-red-500 mb-4">Error: {error}</div>
        )}

        {projectData ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Project Visualization</h2>
            {/* Replace this with your actual visualization component */}
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(projectData, null, 2)}
            </pre>
          </div>
        ) : (
          <p>Loading project data...</p>
        )}
      </main>
    </div>
  );
}