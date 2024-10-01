'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import DynamicHeader from './components/dynamic_header';

export default function Home() {
  const [projectName, setProjectName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (projectName.trim()) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <DynamicHeader />
      <main className="max-w-4xl mx-auto mt-8">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to Rub-A-Duck</h1>
        <p className="text-lg text-center mb-8">
          Your AI-powered project management assistant that breaks down complex projects into manageable tasks.
        </p>

        <div className="text-center mb-12">
          <Link href="/result" passHref>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300">
              Let&apos;s build your project
            </button>
          </Link>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your project name and description</li>
            <li>Our AI breaks down your project into smaller subtasks</li>
            <li>LLMGraphTransformer generates a knowledge graph</li>
            <li>Review and manage your project structure</li>
          </ol>
        </div>

        <div className="mt-8 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
          <p className="font-bold">Tip</p>
          <p>For best results, provide a clear and detailed project description. The more information you give, the better we can assist you!</p>
        </div>
      </main>
    </div>
  );
}