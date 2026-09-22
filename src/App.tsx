import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { UmkmMobileNav } from './components/UmkmMobileNav.tsx';

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
import { MentorSessions } from './views/mentor/MentorSessions.tsx';
import { MentorActionPlans } from './views/mentor/MentorActionPlans.tsx';
import { MentorUmkmDetail } from './views/mentor/MentorUmkmDetail.tsx';
import { MentorProfile } from './views/mentor/MentorProfile.tsx';

// Admin Views
import { AdminDashboard } from './views/admin/AdminDashboard.tsx';
import { AdminMentoringActivities } from './views/admin/AdminMentoringActivities.tsx';
import { AdminTransactions } from './views/admin/AdminTransactions.tsx';
import { AdminPrograms } from './views/admin/AdminPrograms.tsx';
import { AdminMentors } from './views/admin/AdminMentors.tsx';
import { AdminAuditLogs } from './views/admin/AdminAuditLogs.tsx';

import { MentorAssignment } from './types/index.ts';

const MainLayout: React.FC = () => {
  const { role, user, loading } = useAuth();

  // URL search query check for invitations or password reset links
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const inviteParam = urlParams?.get('invite');
  const resetParam = urlParams?.get('reset');

  // Navigation state defaults based on role
  const getDefaultTab = () => {
    if (role === 'ADMIN') return 'admin-dashboard';
    if (role === 'MENTOR') return 'mentor-dashboard';
    return 'umkm-dashboard';
  };

  const [activeTab, setActiveTab] = useState<string>(getDefaultTab());
  const [selectedAssignment, setSelectedAssignment] = useState<MentorAssignment | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Strict role enforcement: ensure activeTab matches current role
  useEffect(() => {
    const isTabValid = (tab: string, currentRole: string) => {
      if (currentRole === 'ADMIN') return tab.startsWith('admin-');
      if (currentRole === 'MENTOR') return tab.startsWith('mentor-');
      if (currentRole === 'UMKM') return tab.startsWith('umkm-');
      return false;
    };

    if (!isTabValid(activeTab, role)) {
      setActiveTab(getDefaultTab());
      setSelectedAssignment(null);
    }
  }, [role, activeTab]);

  const handleSelectUmkmForMentoring = (assignment: MentorAssignment) => {
    setSelectedAssignment(assignment);
    setActiveTab('mentor-umkm-detail');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-300">
            Memuat Sistem Pendampingan UMKM...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, display the initial Landing Page
  if (!user) {
    return <LandingPage initialInviteToken={inviteParam} initialResetToken={resetParam} />;
  }

  return (
    <div className="h-screen h-[100dvh] bg-slate-50 text-slate-900 antialiased flex flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden relative">
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
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${role === 'UMKM' && activeTab === 'umkm-sales-new' ? 'pb-36' : 'pb-6 sm:pb-8'}`}>
          <div className="mx-auto max-w-7xl">
            {/* UMKM Route Handling - Only accessible by UMKM */}
            {role === 'UMKM' && (
              <>
                {activeTab === 'umkm-dashboard' && (
                  <UmkmDashboard onNavigate={(t) => setActiveTab(t)} />
                )}
                {(activeTab === 'umkm-sales' || activeTab === 'umkm-sales-list') && (
                  <UmkmSalesList onAddNew={() => setActiveTab('umkm-sales-new')} />
                )}
                {activeTab === 'umkm-sales-new' && (
                  <UmkmSalesForm
                    onSuccess={() => setActiveTab('umkm-sales-list')}
                    onCancel={() => setActiveTab('umkm-sales-list')}
                  />
                )}
                {activeTab === 'umkm-products' && <UmkmProducts />}
                {activeTab === 'umkm-analytics' && <UmkmAnalytics />}
                {activeTab === 'umkm-mentoring' && <UmkmMentoring />}
                {activeTab === 'umkm-profile' && <UmkmProfile />}
              </>
            )}

            {/* Mentor Route Handling - Only accessible by Mentor */}
            {role === 'MENTOR' && (
              <>
                {activeTab === 'mentor-dashboard' && (
                  <MentorDashboard
                    onSelectUmkm={handleSelectUmkmForMentoring}
                    onNavigate={(t) => setActiveTab(t)}
                  />
                )}
                {activeTab === 'mentor-umkms' && (
                  <MentorDashboard
                    onSelectUmkm={handleSelectUmkmForMentoring}
                    onNavigate={(t) => setActiveTab(t)}
                    showOnlyUmkms={true}
                  />
                )}
                {activeTab === 'mentor-sessions' && (
                  <MentorSessions onSelectUmkm={handleSelectUmkmForMentoring} />
                )}
                {activeTab === 'mentor-action-plans' && (
                  <MentorActionPlans onSelectUmkm={handleSelectUmkmForMentoring} />
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

            {/* Admin Route Handling - Only accessible by Admin */}
            {role === 'ADMIN' && (
              <>
                {activeTab === 'admin-dashboard' && (
                  <AdminDashboard onNavigate={(t) => setActiveTab(t)} />
                )}
                {activeTab === 'admin-mentoring' && <AdminMentoringActivities />}
                {activeTab === 'admin-transactions' && <AdminTransactions />}
                {activeTab === 'admin-programs' && <AdminPrograms />}
                {activeTab === 'admin-mentors' && <AdminMentors />}
                {activeTab === 'admin-audit' && <AdminAuditLogs />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* UMKM One-Handed Quick Mobile Bottom Navigation & Desktop FAB */}
      {role === 'UMKM' && (
        <UmkmMobileNav
          currentTab={activeTab}
          onSelectTab={(tab: string) => {
            setActiveTab(tab);
            setSelectedAssignment(null);
          }}
        />
      )}
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
