import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Database, 
  Clock, 
  Flame 
} from 'lucide-react';
import { useGcpData } from './hooks/useGcpData';
import Sidebar from './components/Sidebar';
import PageOverview from './components/PageOverview';
import PageParameterGrid from './components/PageParameterGrid';
import PageMachineDetails from './components/PageMachineDetails';

export function App() {
  const {
    connectionState,
    anomalyActive,
    alerts,
    machines,
    histories,
    toggleAnomaly,
    toggleConnection,
    acknowledgeAlert,
    clearAllAlerts
  } = useGcpData();

  // Navigation state management: 'overview' | 'parameter' | 'machine'
  const [activePage, setActivePage] = useState('overview');
  const [activeMetric, setActiveMetric] = useState('temperature');
  const [selectedMachineId, setSelectedMachineId] = useState('machine_alpha');
  
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());

  // Digital Live Clock ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const selectedMachineHistory = histories[selectedMachineId] || [];

  return (
    <div className="app-workspace-layout">
      {/* 1. Common Left Sidebar */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        activeMetric={activeMetric}
        setActiveMetric={setActiveMetric}
        connectionState={connectionState}
        userName="Pushkar Shelar"
      />

      {/* Right side area: Header + Pages */}
      <div className="main-content-area">
        
        {/* Global Operations Header */}
        <header className="dashboard-header" style={{ flexShrink: 0 }}>
          <div className="header-title">
            <div className={`pulse-indicator ${anomalyActive ? 'alerting' : ''}`} />
            <h1 style={{ fontSize: '1.25rem' }}>IIoT Operations Command Center</h1>
          </div>

          {/* Controls Panel */}
          <div className="controls-bar">
            {/* Connection Toggle */}
            <button 
              className={`control-btn ${connectionState === 'live' ? 'active' : ''}`}
              onClick={toggleConnection}
              title="Toggle Data Source Connection"
            >
              {connectionState === 'live' ? (
                <>
                  <Cloud size={14} />
                  <span>GCP Cloud Active</span>
                </>
              ) : (
                <>
                  <Database size={14} />
                  <span>Simulator Active</span>
                </>
              )}
            </button>

            {/* Anomaly Injector */}
            <button
              className={`control-btn danger ${anomalyActive ? 'active' : ''}`}
              onClick={toggleAnomaly}
              title="Test Warning Thresholds (45%, 30%, 10%)"
            >
              <Flame size={14} />
              <span>{anomalyActive ? 'Stop Anomaly' : 'Test Alarms'}</span>
            </button>

            {/* Live Clock widget */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(10, 15, 30, 0.4)',
              border: '1px solid rgba(38, 55, 96, 0.3)',
              padding: '6px 12px',
              borderRadius: '6px',
              color: '#38bdf8',
              fontFamily: "'Orbitron', monospace",
              fontSize: '0.75rem'
            }}>
              <Clock size={12} />
              <span>{systemTime}</span>
            </div>
          </div>
        </header>

        {/* 2. Main Page Render Area */}
        <main style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {activePage === 'overview' && (
            <PageOverview 
              machines={machines}
              alerts={alerts}
              acknowledgeAlert={acknowledgeAlert}
              clearAllAlerts={clearAllAlerts}
              setSelectedMachineId={setSelectedMachineId}
              setActivePage={setActivePage}
            />
          )}

          {activePage === 'parameter' && (
            <PageParameterGrid 
              machines={machines}
              activeMetric={activeMetric}
              histories={histories}
              setSelectedMachineId={setSelectedMachineId}
              setActivePage={setActivePage}
            />
          )}

          {activePage === 'machine' && (
            <PageMachineDetails 
              machine={selectedMachine}
              history={selectedMachineHistory}
              setActivePage={setActivePage}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
