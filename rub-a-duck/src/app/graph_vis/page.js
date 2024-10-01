'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import DynamicHeader from '../components/dynamic_header';
import { useSearchParams } from 'next/navigation'
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from '../components/custom_nodes';
// const CustomNode = ({ data }) => (
//   <div className="bg-white border-2 border-gray-300 rounded p-2 shadow-md w-80 flex flex-col justify-between">
//     <Handle type="target" position="top" />
//     <div className="font-bold truncate">{data.label}</div>
//     {/* <div>{data.nodeNum}</div> */}
//     <div className="text-sm text-gray-600">{data.description}</div>
//     <div className="text-sm italic">Time: {data.estimatedTime}</div>
//     <Handle type="source" position="bottom" />
//   </div>
// );

const nodeTypes = {
  custom: CustomNode,
};

function ProjectFlowChart({ projectData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const transformData = useCallback((data, parentId = null, depth = 0, branchIndex = 0) => {
    let nodes = [];
    let edges = [];
    const nodeId = parentId ? `${parentId}-${depth}-${branchIndex}` : 'root';
    
    // Calculate position based on depth and branchIndex
    const xSpacing = 400;
    const ySpacing = 200;
    let nodePosition = {
      x: branchIndex * xSpacing ,
      y: depth * ySpacing}
    if (parentId !== null && parentId !== 'root') {
    nodePosition = { x: branchIndex * xSpacing + (2-parentId[parentId.length-1])*1000, y: depth * ySpacing };
    };

    nodes.push({
      id: nodeId,
      type: 'custom',
      position: nodePosition,
      data: { 
        nodeNum: nodeId,
        label: data.description, 
        description: data.technical_description,
        estimatedTime: data.estimated_time 
      },
    });

    if (parentId !== null) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      });
    }

    if (data.subtasks && data.subtasks.length > 0) {
      data.subtasks.forEach((subtask, subtaskIndex) => {
        const [childNodes, childEdges] = transformData(subtask, nodeId, depth + 1, subtaskIndex);
        nodes = [...nodes, ...childNodes];
        edges = [...edges, ...childEdges];
      });
    }

    return [nodes, edges];
  }, []);

  useEffect(() => {
    if (projectData) {
      const [transformedNodes, transformedEdges] = transformData(projectData);
      setNodes(transformedNodes);
      setEdges(transformedEdges);
    }
  }, [projectData, transformData, setNodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '800px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

function ProjectDataFetcher({ setProjectData, setError }) {
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
            description: parsedData.description,
            technical_description: parsedData.technical_description,
            estimatedTime: parsedData.estimated_time,
          }));

          if (storedIdentifier === identifier) {
            setProjectData(parsedData);
            return;
          }
        }
      }
      
      setError("Project data not found. You may need to regenerate the project breakdown.");
    } catch (err) {
      setError("Error retrieving project data: " + err.message);
    }
  };

  return null; // This component doesn't render anything
}

export default function Graph_Vis() {
  const [projectData, setProjectData] = useState(null);
  const [error, setError] = useState(null);

  return (
    <div className="min-h-screen p-8">
      <DynamicHeader />

      <main className="w-full mx-auto">
        <Suspense fallback={<p>Loading project data...</p>}>
          <ProjectDataFetcher setProjectData={setProjectData} setError={setError} />
        </Suspense>

        {error && (
          <div className="text-red-500 mb-4">Error: {error}</div>
        )}

        {projectData ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Project Visualization</h2>
            <ProjectFlowChart projectData={projectData} />
          </div>
        ) : (
          <p>Waiting for project data...</p>
        )}
      </main>
    </div>
  );
}