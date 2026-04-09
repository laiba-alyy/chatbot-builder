import React, { useState, useRef, useEffect } from 'react';
import './BotEditor.css';

const BotEditor = () => {
  const [nodes, setNodes] = useState([
    {
      id: 'welcome',
      type: 'message',
      position: { x: 400, y: 100 },
      data: {
        title: 'Welcome Message',
        content: 'Hello! How can I help you today?',
        buttons: ['Get Started', 'View Products', 'Contact Support']
      }
    },
    {
      id: 'options',
      type: 'choice',
      position: { x: 400, y: 300 },
      data: {
        title: 'User Choice',
        question: 'What would you like to do?',
        options: [
          { id: 'opt1', text: 'Browse Products', nextNode: 'products' },
          { id: 'opt2', text: 'Get Support', nextNode: 'support' },
          { id: 'opt3', text: 'Talk to Human', nextNode: 'human' }
        ]
      }
    },
    {
      id: 'products',
      type: 'message',
      position: { x: 200, y: 500 },
      data: {
        title: 'Product Catalog',
        content: 'We have electronics, clothing, and accessories. What interests you?',
        buttons: ['Electronics', 'Clothing', 'Accessories', 'Back']
      }
    },
    {
      id: 'support',
      type: 'message',
      position: { x: 600, y: 500 },
      data: {
        title: 'Support Options',
        content: 'How can we help you today?',
        buttons: ['FAQs', 'Contact Support', 'Report Issue', 'Back']
      }
    },
    {
      id: 'human',
      type: 'action',
      position: { x: 400, y: 700 },
      data: {
        title: 'Transfer to Human',
        content: 'Transferring you to a human agent...',
        action: 'transfer_to_human',
        email: 'support@company.com'
      }
    }
  ]);

  const [connections, setConnections] = useState([
    { from: 'welcome', to: 'options' },
    { from: 'options', to: 'products' },
    { from: 'options', to: 'support' },
    { from: 'options', to: 'human' }
  ]);

  const [selectedNode, setSelectedNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [connectionEnd, setConnectionEnd] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [botName, setBotName] = useState('Customer Support Bot');
  const [botStatus, setBotStatus] = useState('draft');

  const editorRef = useRef(null);
  const canvasRef = useRef(null);

  // Node types available in toolbox
  const nodeTypes = [
    { type: 'message', icon: '💬', label: 'Message', color: '#40e0d0' },
    { type: 'choice', icon: '🔀', label: 'Choice', color: '#6464ff' },
    { type: 'action', icon: '⚡', label: 'Action', color: '#9333ea' },
    { type: 'condition', icon: '🔍', label: 'Condition', color: '#ff6b6b' },
    { type: 'api', icon: '🔌', label: 'API Call', color: '#ffa444' },
    { type: 'email', icon: '📧', label: 'Send Email', color: '#40e0d0' },
    { type: 'delay', icon: '⏱️', label: 'Delay', color: '#6464ff' },
    { type: 'webhook', icon: '🔄', label: 'Webhook', color: '#9333ea' }
  ];

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && selectedNode) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - dragOffset.x) / zoom - pan.x;
        const y = (e.clientY - rect.top - dragOffset.y) / zoom - pan.y;
        
        setNodes(prev => prev.map(node => 
          node.id === selectedNode.id 
            ? { ...node, position: { x, y } }
            : node
        ));
      }

      if (isConnecting) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom - pan.x;
        const y = (e.clientY - rect.top) / zoom - pan.y;
        setConnectionEnd({ x, y });
      }

      if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = (e) => {
      if (isDragging) {
        setIsDragging(false);
      }

      if (isConnecting) {
        // Check if dropped on a node
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom - pan.x;
        const y = (e.clientY - rect.top) / zoom - pan.y;
        
        const targetNode = nodes.find(node => {
          const nodeX = node.position.x * zoom + pan.x * zoom + rect.left;
          const nodeY = node.position.y * zoom + pan.y * zoom + rect.top;
          const nodeWidth = 200 * zoom;
          const nodeHeight = 150 * zoom;
          return (
            e.clientX >= nodeX - nodeWidth/2 &&
            e.clientX <= nodeX + nodeWidth/2 &&
            e.clientY >= nodeY - nodeHeight/2 &&
            e.clientY <= nodeY + nodeHeight/2
          );
        });

        if (targetNode && connectionStart && targetNode.id !== connectionStart.id) {
          setConnections(prev => [
            ...prev,
            { from: connectionStart.id, to: targetNode.id }
          ]);
        }

        setIsConnecting(false);
        setConnectionStart(null);
        setConnectionEnd(null);
      }

      if (isPanning) {
        setIsPanning(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedNode, dragOffset, isConnecting, connectionStart, isPanning, panStart, nodes, zoom, pan]);

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - (node.position.x * zoom + pan.x * zoom + rect.left);
    const offsetY = e.clientY - (node.position.y * zoom + pan.y * zoom + rect.top);
    
    setSelectedNode(node);
    setIsDragging(true);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    setMenuPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setShowNodeMenu(true);
  };

  const addNode = (type) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (menuPosition.x - rect.left) / zoom - pan.x;
    const y = (menuPosition.y - rect.top) / zoom - pan.y;

    const newNode = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x, y },
      data: {
        title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        content: type === 'message' ? 'Enter your message here' :
                 type === 'choice' ? 'What would you like to do?' :
                 type === 'action' ? 'Action to perform' : 'Configure this node'
      }
    };

    setNodes([...nodes, newNode]);
    setShowNodeMenu(false);
  };

  const startConnection = (e, node) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;
    
    setIsConnecting(true);
    setConnectionStart(node);
    setConnectionEnd({ x, y });
  };

  const deleteNode = (nodeId) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    setConnections(connections.filter(conn => conn.from !== nodeId && conn.to !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const deleteConnection = (from, to) => {
    setConnections(connections.filter(conn => !(conn.from === from && conn.to === to)));
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const simulateBot = () => {
    setShowPreview(true);
    setPreviewMessages([
      { role: 'bot', content: 'Hello! How can I help you today?' },
      { role: 'user', content: 'I want to buy a product' },
      { role: 'bot', content: 'Great! We have electronics, clothing, and accessories. What interests you?' }
    ]);
  };

  const renderNode = (node) => {
    const nodeStyle = {
      left: node.position.x * zoom + pan.x * zoom,
      top: node.position.y * zoom + pan.y * zoom,
      transform: 'translate(-50%, -50%)'
    };

    const nodeColors = {
      message: '#40e0d0',
      choice: '#6464ff',
      action: '#9333ea',
      condition: '#ff6b6b',
      api: '#ffa444',
      email: '#40e0d0',
      delay: '#6464ff',
      webhook: '#9333ea'
    };

    return (
      <div
        key={node.id}
        className={`flow-node ${node.type} ${selectedNode?.id === node.id ? 'selected' : ''}`}
        style={nodeStyle}
        onMouseDown={(e) => handleNodeMouseDown(e, node)}
      >
        <div className="node-header" style={{ backgroundColor: nodeColors[node.type] + '20' }}>
          <span className="node-icon">{nodeTypes.find(t => t.type === node.type)?.icon}</span>
          <span className="node-title">{node.data.title}</span>
          <button className="node-delete" onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}>✕</button>
        </div>
        
        <div className="node-content">
          {node.type === 'message' && (
            <>
              <p className="node-message">{node.data.content}</p>
              {node.data.buttons && (
                <div className="node-buttons">
                  {node.data.buttons.map((btn, i) => (
                    <span key={i} className="node-button">{btn}</span>
                  ))}
                </div>
              )}
            </>
          )}

          {node.type === 'choice' && (
            <>
              <p className="node-question">{node.data.question}</p>
              <div className="node-options">
                {node.data.options.map((opt, i) => (
                  <div key={i} className="node-option">
                    <span className="option-text">{opt.text}</span>
                    <span className="option-connector">→</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {node.type === 'action' && (
            <>
              <p className="node-action">{node.data.content}</p>
              <span className="action-type">{node.data.action}</span>
            </>
          )}
        </div>

        <div className="node-ports">
          <div 
            className="port input" 
            title="Input"
            onClick={(e) => e.stopPropagation()}
          ></div>
          <div 
            className="port output" 
            title="Output"
            onMouseDown={(e) => startConnection(e, node)}
          ></div>
        </div>
      </div>
    );
  };

  const renderConnection = (conn, index) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    
    if (!fromNode || !toNode) return null;

    const startX = fromNode.position.x * zoom + pan.x * zoom;
    const startY = fromNode.position.y * zoom + pan.y * zoom + 30;
    const endX = toNode.position.x * zoom + pan.x * zoom;
    const endY = toNode.position.y * zoom + pan.y * zoom - 30;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    return (
      <g key={index} className="connection" onClick={() => deleteConnection(conn.from, conn.to)}>
        <path
          d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
          className="connection-path"
        />
        <circle cx={midX} cy={midY} r="8" className="connection-delete" />
        <text x={midX - 4} y={midY + 4} className="connection-delete-icon">✕</text>
      </g>
    );
  };

  return (
    <div className="bot-editor">
      {/* Header */}
      <div className="editor-header">
        <div className="bot-info">
          <input
            type="text"
            className="bot-name-input"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="Bot Name"
          />
          <span className={`bot-status ${botStatus}`}>
            {botStatus === 'draft' && '📝 Draft'}
            {botStatus === 'published' && '🚀 Published'}
            {botStatus === 'training' && '🔄 Training'}
          </span>
        </div>

        <div className="header-actions">
          <button className="preview-btn" onClick={simulateBot}>
            <span className="btn-icon">👁️</span>
            Preview
          </button>
          <button className="save-btn">
            <span className="btn-icon">💾</span>
            Save
          </button>
          <button className="publish-btn">
            <span className="btn-icon">🚀</span>
            Publish
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button className="tool-btn" onClick={() => handleZoom(0.1)} title="Zoom In">
            <span className="tool-icon">🔍+</span>
          </button>
          <button className="tool-btn" onClick={() => handleZoom(-0.1)} title="Zoom Out">
            <span className="tool-icon">🔍-</span>
          </button>
          <button className="tool-btn" onClick={() => setZoom(1)} title="Reset Zoom">
            <span className="tool-icon">🔄</span>
          </button>
        </div>

        <div className="toolbar-group">
          <button className="tool-btn" title="Undo">
            <span className="tool-icon">↩️</span>
          </button>
          <button className="tool-btn" title="Redo">
            <span className="tool-icon">↪️</span>
          </button>
        </div>

        <div className="toolbar-group">
          <button className="tool-btn" title="Align Left">
            <span className="tool-icon">⬅️</span>
          </button>
          <button className="tool-btn" title="Align Center">
            <span className="tool-icon">⬆️</span>
          </button>
          <button className="tool-btn" title="Align Right">
            <span className="tool-icon">➡️</span>
          </button>
        </div>

        <div className="zoom-level">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Main Editor Area */}
      <div 
        className="editor-canvas"
        ref={editorRef}
        onContextMenu={handleCanvasContextMenu}
        onMouseDown={handleCanvasMouseDown}
      >
        <svg className="connections-layer">
          {connections.map((conn, index) => renderConnection(conn, index))}
          {isConnecting && connectionStart && connectionEnd && (
            <path
              d={`M ${connectionStart.position.x * zoom + pan.x * zoom} ${connectionStart.position.y * zoom + pan.y * zoom + 30} C ${connectionStart.position.x * zoom + pan.x * zoom} ${connectionEnd.y}, ${connectionEnd.x} ${connectionEnd.y}, ${connectionEnd.x} ${connectionEnd.y}`}
              className="connection-path temp"
            />
          )}
        </svg>

        <div className="nodes-layer" ref={canvasRef}>
          {nodes.map(node => renderNode(node))}
        </div>

        {/* Node Menu */}
        {showNodeMenu && (
          <div 
            className="node-menu"
            style={{
              left: menuPosition.x,
              top: menuPosition.y
            }}
          >
            <div className="menu-header">Add Node</div>
            <div className="menu-items">
              {nodeTypes.map(type => (
                <div
                  key={type.type}
                  className="menu-item"
                  onClick={() => addNode(type.type)}
                >
                  <span className="menu-icon" style={{ color: type.color }}>{type.icon}</span>
                  <span className="menu-label">{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="properties-panel">
          <div className="panel-header">
            <h3>Node Properties</h3>
            <button className="close-panel" onClick={() => setSelectedNode(null)}>✕</button>
          </div>

          <div className="panel-content">
            <div className="property-group">
              <label>Node Type</label>
              <div className="node-type-badge" style={{ backgroundColor: nodeTypes.find(t => t.type === selectedNode.type)?.color + '20' }}>
                <span className="type-icon">{nodeTypes.find(t => t.type === selectedNode.type)?.icon}</span>
                <span className="type-name">{selectedNode.type}</span>
              </div>
            </div>

            <div className="property-group">
              <label>Title</label>
              <input
                type="text"
                className="property-input"
                value={selectedNode.data.title}
                onChange={(e) => {
                  const updated = { ...selectedNode };
                  updated.data.title = e.target.value;
                  setNodes(nodes.map(node => node.id === selectedNode.id ? updated : node));
                }}
              />
            </div>

            {selectedNode.type === 'message' && (
              <>
                <div className="property-group">
                  <label>Message Content</label>
                  <textarea
                    className="property-textarea"
                    value={selectedNode.data.content}
                    onChange={(e) => {
                      const updated = { ...selectedNode };
                      updated.data.content = e.target.value;
                      setNodes(nodes.map(node => node.id === selectedNode.id ? updated : node));
                    }}
                    rows="4"
                  />
                </div>

                <div className="property-group">
                  <label>Quick Reply Buttons</label>
                  <div className="buttons-editor">
                    {selectedNode.data.buttons?.map((btn, index) => (
                      <div key={index} className="button-item">
                        <input
                          type="text"
                          value={btn}
                          onChange={(e) => {
                            const updated = { ...selectedNode };
                            updated.data.buttons[index] = e.target.value;
                            setNodes(nodes.map(node => node.id === selectedNode.id ? updated : node));
                          }}
                          className="button-input"
                        />
                        <button className="remove-button" onClick={() => {
                          const updated = { ...selectedNode };
                          updated.data.buttons = updated.data.buttons.filter((_, i) => i !== index);
                          setNodes(nodes.map(node => node.id === selectedNode.id ? updated : node));
                        }}>✕</button>
                      </div>
                    ))}
                    <button 
                      className="add-button"
                      onClick={() => {
                        const updated = { ...selectedNode };
                        if (!updated.data.buttons) updated.data.buttons = [];
                        updated.data.buttons.push('New Button');
                        setNodes(nodes.map(node => node.id === selectedNode.id ? updated : node));
                      }}
                    >
                      + Add Button
                    </button>
                  </div>
                </div>
              </>
            )}

            {selectedNode.type === 'choice' && (
              <>
                <div className="property-group">
                  <label>Question</label>
                  <input
                    type="text"
                    className="property-input"
                    value={selectedNode.data.question}
                    onChange={(e) => {
                      const updated = { ...selectedNode };
                      updated.data.question = e.target.value;
                      setNodes(nodes.map(node => node.id === selectedNode.id ? updated : node));
                    }}
                  />
                </div>

                <div className="property-group">
                  <label>Options</label>
                  <div className="options-editor">
                    {selectedNode.data.options?.map((opt, index) => (
                      <div key={index} className="option-item">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const updated = { ...selectedNode };
                            updated.data.options[index].text = e.target.value;
                            setNodes(nodes.map(node => node.id === selectedNode.id ? updated : node));
                          }}
                          className="option-input"
                        />
                        <select 
                          className="option-connect"
                          value={opt.nextNode}
                          onChange={(e) => {
                            const updated = { ...selectedNode };
                            updated.data.options[index].nextNode = e.target.value;
                            setNodes(nodes.map(node => node.id === selectedNode.id ? updated : node));
                          }}
                        >
                          <option value="">Select target...</option>
                          {nodes.filter(n => n.id !== selectedNode.id).map(n => (
                            <option key={n.id} value={n.id}>{n.data.title}</option>
                          ))}
                        </select>
                        <button className="remove-option" onClick={() => {
                          const updated = { ...selectedNode };
                          updated.data.options = updated.data.options.filter((_, i) => i !== index);
                          setNodes(nodes.map(node => node.id === selectedNode.id ? updated : node));
                        }}>✕</button>
                      </div>
                    ))}
                    <button 
                      className="add-button"
                      onClick={() => {
                        const updated = { ...selectedNode };
                        if (!updated.data.options) updated.data.options = [];
                        updated.data.options.push({
                          id: `opt${Date.now()}`,
                          text: 'New Option',
                          nextNode: ''
                        });
                        setNodes(nodes.map(node => node.id === selectedNode.id ? updated : node));
                      }}
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="preview-modal">
          <div className="preview-content">
            <div className="preview-header">
              <h3>Bot Preview</h3>
              <button className="close-preview" onClick={() => setShowPreview(false)}>✕</button>
            </div>

            <div className="preview-chat">
              {previewMessages.map((msg, index) => (
                <div key={index} className={`preview-message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'bot' ? '🤖' : '👤'}
                  </div>
                  <div className="message-bubble">
                    {msg.content}
                  </div>
                </div>
              ))}

              <div className="preview-input">
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  disabled
                />
                <button disabled>Send</button>
              </div>
            </div>

            <div className="preview-controls">
              <button className="restart-btn">Restart Conversation</button>
              <button className="close-btn" onClick={() => setShowPreview(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotEditor;