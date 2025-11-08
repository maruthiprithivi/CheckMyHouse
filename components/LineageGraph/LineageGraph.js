'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Button from '@/components/ui/Button';

const nodeTypes = {
  table: TableNode,
  materialized_view: MaterializedViewNode,
};

export default function LineageGraph({ nodes: initialNodes, edges: initialEdges }) {
  const defaultEdgeOptions = {
    animated: true,
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: '#10b981',
    },
    style: { stroke: '#10b981', strokeWidth: 2 },
  };
  // Process nodes for positioning
  const processedNodes = initialNodes.map((node, index) => ({
    ...node,
    position: {
      x: (index % 5) * 250,
      y: Math.floor(index / 5) * 150,
    },
    type: node.type === 'materialized_view' ? 'materialized_view' : 'table',
  }));

  // Process edges with styling
  const processedEdges = initialEdges.map((edge) => ({
    ...edge,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#10b981',
    },
    style: {
      strokeWidth: 2,
      stroke: '#10b981',
    },
    animated: true,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(processedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(processedEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const fitView = useCallback((reactFlowInstance) => {
    reactFlowInstance?.fitView({ padding: 0.2, duration: 800 });
  }, []);

  return (
    <div className="relative">
      <div className="h-[600px] border rounded-lg bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={defaultEdgeOptions}
          attributionPosition="bottom-left"
        >
          <Background color="#94a3b8" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) =>
              node.type === 'materialized_view' ? '#a855f7' : '#3b82f6'
            }
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border p-4 z-10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold text-lg">{selectedNode.data.label}</h4>
              <p className="text-sm text-muted-foreground">{selectedNode.data.database}</p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">
                {selectedNode.type === 'materialized_view' ? 'Materialized View' : 'Table'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Engine:</span>
              <span className="font-medium text-xs">{selectedNode.data.engine}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Full Name:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {selectedNode.id}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TableNode({ data }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-lg bg-white border-2 border-blue-400 min-w-[180px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">📊</span>
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs text-muted-foreground">{data.database}</div>
      <div className="mt-2 text-xs bg-blue-50 px-2 py-1 rounded text-blue-700 font-medium">
        Table
      </div>
    </div>
  );
}

function MaterializedViewNode({ data }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-lg bg-white border-2 border-purple-400 min-w-[180px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">👁️</span>
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs text-muted-foreground">{data.database}</div>
      <div className="mt-2 text-xs bg-purple-50 px-2 py-1 rounded text-purple-700 font-medium">
        Materialized View
      </div>
    </div>
  );
}
