import { useState, useEffect } from 'react';
import type { Screen } from './types';
import { useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import Login from './screens/Login';
import DoctorDashboard from './screens/DoctorDashboard';
import NurseDashboard from './screens/NurseDashboard';
import WardBedView from './screens/WardBedView';
import PatientList from './screens/PatientList';
import PatientProfile from './screens/PatientProfile';
import PatientHistory from './screens/PatientHistory';
import RecordVitals from './screens/RecordVitals';
import MedicationManagement from './screens/MedicationManagement';
import WardRound from './screens/WardRound';
import NursingNotes from './screens/NursingNotes';
import Notifications from './screens/Notifications';
import AdminDashboard from './screens/AdminDashboard';
import AdminPatients from './screens/AdminPatients';
import AdminWards from './screens/AdminWards';
import AdminUsers from './screens/AdminUsers';
import ERDiagram from './screens/ERDiagram';

function AppShell() {
  const { user, loading, logout } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ screen: Screen; patientId: string | null }[]>([]);
  const [notifCount, setNotifCount] = useState(3);

  useEffect(() => {
    if (user) {
      const defaultScreen: Screen =
        user.role === 'doctor' ? 'doctor-dashboard' :
        user.role === 'nurse'  ? 'nurse-dashboard'  : 'admin-dashboard';
      setScreen(defaultScreen);
      setHistory([]);
    } else if (!loading) {
      setScreen('login');
    }
  }, [user, loading]);

  const navigate = (s: Screen, patientId?: string) => {
    setHistory(prev => [...prev, { screen, patientId: selectedPatientId }]);
    setScreen(s);
    if (patientId !== undefined) setSelectedPatientId(patientId);
  };

  const goBack = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setScreen(prev.screen);
      setSelectedPatientId(prev.patientId);
      setHistory(h => h.slice(0, -1));
    }
  };

  const handleLogout = () => {
    logout();
    setSelectedPatientId(null);
    setHistory([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading SmartWard...</p>
        </div>
      </div>
    );
  }

  if (!user || screen === 'login') {
    return <Login />;
  }

  const pid = selectedPatientId ?? 'P-10042';

  const renderScreen = () => {
    switch (screen) {
      case 'doctor-dashboard':
        return <DoctorDashboard user={user} onNavigate={navigate} />;
      case 'nurse-dashboard':
        return <NurseDashboard user={user} onNavigate={navigate} />;
      case 'ward-bed':
        return <WardBedView onNavigate={navigate} />;
      case 'patient-list':
        return <PatientList onNavigate={navigate} />;
      case 'patient-profile':
        return <PatientProfile patientId={pid} role={user.role} onNavigate={navigate} onBack={goBack} />;
      case 'patient-history':
        return <PatientHistory patientId={pid} onNavigate={navigate} onBack={goBack} />;
      case 'record-vitals':
        return <RecordVitals patientId={pid} nurseOrDoctor={user.name} onNavigate={navigate} onBack={goBack} />;
      case 'medications':
        return <MedicationManagement patientId={pid} nurseName={user.name} onNavigate={navigate} onBack={goBack} />;
      case 'ward-round':
        return <WardRound patientId={pid} doctorName={user.name} onNavigate={navigate} onBack={goBack} />;
      case 'nursing-notes':
        return <NursingNotes patientId={pid} nurseName={user.name} onNavigate={navigate} onBack={goBack} />;
      case 'notifications':
        return <Notifications onNavigate={navigate} onUnreadCountChange={setNotifCount} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={navigate} />;
      case 'admin-patients':
        return <AdminPatients onNavigate={navigate} />;
      case 'admin-wards':
        return <AdminWards onNavigate={navigate} />;
      case 'admin-users':
        return <AdminUsers />;
      case 'er-diagram':
        return <ERDiagram />;
      default:
        return <DoctorDashboard user={user} onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar
        role={user.role}
        currentScreen={screen}
        userName={user.name}
        onNavigate={navigate}
        onLogout={handleLogout}
        notifCount={notifCount}
      />
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {renderScreen()}
      </main>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
