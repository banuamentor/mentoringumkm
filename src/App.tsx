import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';

// UMKM Views
import { UmkmDashboard } from './views/umkm/UmkmDashboard.tsx';
import { UmkmSalesList } from './views/umkm/UmkmSalesList.tsx';
import { UmkmSalesForm } from './views/umkm/UmkmSalesForm.tsx';
import { UmkmProducts } from './views/umkm/UmkmProducts.tsx';
import { UmkmAnalytics } from './views/umkm/UmkmAnalytics.tsx';
import { UmkmMentoring } from './views/umkm/UmkmMentoring.tsx';
import { UmkmProfile } from './views/umkm/UmkmProfile.tsx';

// Mentor Views
import { MentorDashboard } from './views/mentor/MentorDashboard.tsx';
import { MentorUmkmDetail } from './views/mentor/MentorUmkmDetail.tsx';
import { MentorProfile } from './views/mentor/MentorProfile.tsx';

// Admin Views
import { AdminDashboard } from './views/admin/AdminDashboard.tsx';
import { AdminPrograms } from './views/admin/AdminPrograms.tsx';
import { AdminAuditLogs } from './views/admin/AdminAuditLogs.tsx';

import { MentorAssignment } from './types/index.ts';

const MainLayout: React.FC = () => {
  const { role, user, loading } = useAuth();

  // Navigation state defaults based on role
  const getDefaultTab = () => {
    if (role === 'ADMIN') return 'admin-dashboard';
    if (role === 'MENTOR') return 'mentor-dashboard';
    return 'umkm-dashboard';
  };

  const [activeTab, setActiveTab] = useState<string>(getDefaultTab());
  const [selectedAssignment, setSelectedAssignment] = useState<MentorAssignment | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // When role changes via demo switcher, reset to default tab
  React.useEffect(() => {
    setActiveTab(getDefaultTab());
    setSelectedAssignment(null);
  }, [role]);

  const handleSelectUmkmForMentoring = (assignment: MentorAssignment) => {
    setSelectedAssignment(assignment);
    setActiveTab('mentor-umkm-detail');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-slate-900 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-600">
            Menyiapkan Sistem Pendampingan & Cloud SQL...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Role-specific Sidebar */}
        <Sidebar
          currentTab={activeTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectTab={(tab: string) => {
            setActiveTab(tab);
            if (tab !== 'mentor-umkm-detail') {
              setSelectedAssignment(null);
            }
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* UMKM Route Handling */}
            {role === 'UMKM' && (
              <>
                {activeTab === 'umkm-dashboard' && (
                  <UmkmDashboard onNavigate={(t) => setActiveTab(t)} />
                )}
                {activeTab === 'umkm-sales' && (
                  <UmkmSalesList onAddNew={() => setActiveTab('umkm-sales-new')} />
                )}
                {activeTab === 'umkm-sales-new' && (
                  <UmkmSalesForm
                    onSuccess={() => setActiveTab('umkm-sales')}
                    onCancel={() => setActiveTab('umkm-sales')}
                  />
                )}
                {activeTab === 'umkm-products' && <UmkmProducts />}
                {activeTab === 'umkm-analytics' && <UmkmAnalytics />}
                {activeTab === 'umkm-mentoring' && <UmkmMentoring />}
                {activeTab === 'umkm-profile' && <UmkmProfile />}
              </>
            )}

            {/* Mentor Route Handling */}
            {role === 'MENTOR' && (
              <>
                {activeTab === 'mentor-dashboard' && (
                  <MentorDashboard
                    onSelectUmkm={handleSelectUmkmForMentoring}
                    onNavigate={(t) => setActiveTab(t)}
                  />
                )}
                {activeTab === 'mentor-umkm-detail' && selectedAssignment && (
                  <MentorUmkmDetail
                    assignment={selectedAssignment}
                    onBack={() => {
                      setSelectedAssignment(null);
                      setActiveTab('mentor-dashboard');
                    }}
                  />
                )}
                {activeTab === 'mentor-profile' && <MentorProfile />}
              </>
            )}

            {/* Admin Route Handling */}
            {role === 'ADMIN' && (
              <>
                {activeTab === 'admin-dashboard' && (
                  <AdminDashboard onNavigate={(t) => setActiveTab(t)} />
                )}
                {activeTab === 'admin-programs' && <AdminPrograms />}
                {activeTab === 'admin-audit' && <AdminAuditLogs />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
