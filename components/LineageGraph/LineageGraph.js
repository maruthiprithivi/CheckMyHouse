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
import { Database, Eye } from 'lucide-react';
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
      <div className="h-[600px] border rounded-lg bg-background">
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
          <Background color="#334155" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) =>
              node.type === 'materialized_view' ? '#a855f7' : '#3b82f6'
            }
            maskColor="rgba(0, 0, 0, 0.3)"
            className="bg-card border border-border"
          />
        </ReactFlow>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 w-80 bg-card rounded-lg shadow-lg border border-border p-4 z-10 text-card-foreground">
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
              <span className="font-medium text-foreground">
                {selectedNode.type === 'materialized_view' ? 'Materialized View' : 'Table'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Engine:</span>
              <span className="font-medium text-xs text-foreground">{selectedNode.data.engine}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Full Name:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded text-foreground">
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
    <div className="px-4 py-3 shadow-md rounded-lg bg-card border-2 border-blue-500/50 min-w-[180px] text-card-foreground">
      <div className="flex items-center gap-2 mb-1">
        <Database className="w-5 h-5 text-blue-500" />
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs text-muted-foreground">{data.database}</div>
      <div className="mt-2 text-xs bg-blue-500/10 px-2 py-1 rounded text-blue-400 font-medium border border-blue-500/20">
        Table
      </div>
    </div>
  );
}

function MaterializedViewNode({ data }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-lg bg-card border-2 border-purple-500/50 min-w-[180px] text-card-foreground">
      <div className="flex items-center gap-2 mb-1">
        <Eye className="w-5 h-5 text-purple-500" />
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs text-muted-foreground">{data.database}</div>
      <div className="mt-2 text-xs bg-purple-500/10 px-2 py-1 rounded text-purple-400 font-medium border border-purple-500/20">
        Materialized View
      </div>
    </div>
  );
}
