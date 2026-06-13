import React, { useState, useEffect } from 'react';
import { Clock, Radio } from 'lucide-react';
import { useGcpData } from './hooks/useGcpData';
import Sidebar from './components/Sidebar';
import PageOverview from './components/PageOverview';
import PageParameterGrid from './components/PageParameterGrid';
import PageMachineDetails from './components/PageMachineDetails';

export function App() {
  const {
    connectionState,
    alerts,
    machines,
    histories,
    acknowledgeAlert,
    clearAllAlerts
  } = useGcpData();

  const [activePage, setActivePage] = useState('overview');
  const [activeMetric, setActiveMetric] = useState('temperature');
  const [selectedMachineId, setSelectedMachineId] = useState('machine_alpha');
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const selectedMachineHistory = histories[selectedMachineId] || [];

  return (
    <div className="app-workspace-layout">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        activeMetric={activeMetric}
        setActiveMetric={setActiveMetric}
        connectionState={connectionState}
        userName="Pushkar Shelar"
      />

      <div className="main-content-area">
        <header className="dashboard-header">
          <div className="header-title">
            <div className="pulse-indicator" />
            <h1>IIoT Machine Health Monitor</h1>
          </div>

          <div className="header-right">
            <div className={`connection-badge ${connectionState === 'live' ? 'live' : 'sim'}`}>
              <Radio size={11} />
              <span>{connectionState === 'live' ? 'ThingSpeak Live' : 'Simulator'}</span>
            </div>
            <div className="clock-widget">
              <Clock size={12} />
              <span>{systemTime}</span>
            </div>
          </div>
        </header>

        <main className="page-area">
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
