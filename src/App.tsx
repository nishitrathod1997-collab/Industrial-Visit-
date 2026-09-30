import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { StudentSidebar } from './components/layout/StudentSidebar';
import { FacultySidebar } from './components/layout/FacultySidebar';
import { AdminSidebar } from './components/layout/AdminSidebar';
import { VitAssistantModal } from './components/ai/VitAssistantModal';
import { BoardingPassModal } from './components/common/BoardingPassModal';
import { Sparkles } from 'lucide-react';

// Student Views
import { StudentHome } from './views/student/StudentHome';
import { StudentExplore } from './views/student/StudentExplore';
import { StudentExperienceDetail } from './views/student/StudentExperienceDetail';
import { StudentMyExperiences } from './views/student/StudentMyExperiences';
import { StudentNotifications } from './views/student/StudentNotifications';
import { StudentLeaveApplication } from './views/student/StudentLeaveApplication';
import { StudentProfileView } from './views/student/StudentProfile';
import { UserSettings } from './views/common/UserSettings';

// Faculty Views
import { FacultyDashboard } from './views/faculty/FacultyDashboard';
import { FacultyExperiences } from './views/faculty/FacultyExperiences';
import { FacultyVisitDetail } from './views/faculty/FacultyVisitDetail';
import { FacultyAttendance } from './views/faculty/FacultyAttendance';
import { FacultyStudentDirectory } from './views/faculty/FacultyStudentDirectory';
import { FacultyLeaveManagement } from './views/faculty/FacultyLeaveManagement';
import { FacultyTimetable } from './views/faculty/FacultyTimetable';
import { FacultyReports } from './views/faculty/FacultyReports';
import { FacultyProfileView } from './views/faculty/FacultyProfile';

// Admin Views
import { AdminOverview } from './views/admin/AdminOverview';
import { AdminFacultyAccounts } from './views/admin/AdminFacultyAccounts';
import { AdminAllExperiences } from './views/admin/AdminAllExperiences';
import { AdminAnalytics } from './views/admin/AdminAnalytics';
import { AdminSystemSettings } from './views/admin/AdminSystemSettings';
import { AdminProfile } from './views/admin/AdminProfile';
import { ExperienceTemplate } from './types';
import { AdminStudentDirectory } from './views/admin/AdminStudentDirectory';
import { AdminRegistrations } from './views/admin/AdminRegistrations';
import { AdminLeaves } from './views/admin/AdminLeaves';
import { AdminAttendance } from './views/admin/AdminAttendance';
import { AdminDocuments } from './views/admin/AdminDocuments';
import { AdminAnnouncements } from './views/admin/AdminAnnouncements';
import { AdminEmailDeliveryLogs } from './views/admin/AdminEmailDeliveryLogs';
import { AdminUsers } from './views/admin/AdminUsers';
import { SecurityEvents } from './views/admin/SecurityEvents';
import { CertificateVerificationView } from './views/common/CertificateVerificationView';
import { LoginPage } from './components/auth/LoginPage';
import { AccessDenied } from './components/auth/AccessDenied';
import { ExperienceWithMeta } from './types';

function MainLayout() {
  const { user, role, loading, unreadNotificationsCount, student, refreshAuth } = useAuth();

  // URL query parameter for certificate verification
  const [verifyCertId, setVerifyCertId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('verify');
  });

  // Parse initial path for routing
  const getInitialTab = (rolePrefix: string, defaultTab: string) => {
    const path = window.location.pathname;
    if (path.startsWith(rolePrefix)) {
      const tab = path.replace(rolePrefix, '');
      if (tab) return tab;
    }
    return defaultTab;
  };

  // Navigation tabs for each role
  const [studentTab, setStudentTab] = useState<string>(() => getInitialTab('/student/', 'home'));
  const [facultyTab, setFacultyTab] = useState<string>(() => getInitialTab('/faculty/', 'dashboard'));
  const [adminTab, setAdminTab] = useState<string>(() => getInitialTab('/admin/', 'overview'));
  const [selectedBlueprint, setSelectedBlueprint] = useState<ExperienceTemplate | null>(null);

  // Sync active tab to URL
  React.useEffect(() => {
    if (!user || loading) return;
    
    let path = '';
    if (role === 'ADMIN') {
      path = `/admin/${adminTab}`;
    } else if (role === 'FACULTY') {
      path = `/faculty/${facultyTab}`;
    } else if (role === 'STUDENT') {
      path = `/student/${studentTab}`;
    }
    
    if (path && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  }, [role, adminTab, facultyTab, studentTab, user, loading]);

  // Listen for browser back/forward buttons
  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (role === 'ADMIN' && path.startsWith('/admin/')) {
        setAdminTab(path.replace('/admin/', '') || 'overview');
      } else if (role === 'FACULTY' && path.startsWith('/faculty/')) {
        setFacultyTab(path.replace('/faculty/', '') || 'dashboard');
      } else if (role === 'STUDENT' && path.startsWith('/student/')) {
        setStudentTab(path.replace('/student/', '') || 'home');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [role]);

  // Selected experience ID for detail navigation
  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null);
  const [facultyVisitDetailTab, setFacultyVisitDetailTab] = useState<
    'overview' | 'confirmed' | 'waitlist' | 'attendance' | 'announcements' | 'emails' | 'documents' | 'reports'
  >('overview');

  // Assistant modal state
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Standalone Boarding Pass modal
  const [activeBoardingPassExp, setActiveBoardingPassExp] = useState<ExperienceWithMeta | null>(null);
  const [facultyCreateOpen, setFacultyCreateOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B2545] flex flex-col items-center justify-center text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black tracking-wider shadow-lg mb-4 border border-amber-300/40">
          <span className="text-sm font-black">VIT</span>
        </div>
        <div className="h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-blue-200 font-medium">Verifying Institutional Credentials...</p>
      </div>
    );
  }

  // Render Login Page if user is unauthenticated
  if (!user && !verifyCertId) {
    return <LoginPage />;
  }

  const handleStudentNavigate = (tab: string, expId?: string) => {
    if (expId) {
      setSelectedExperienceId(expId);
    }
    setStudentTab(tab);
  };

  const handleFacultyNavigate = (tab: string, expId?: string) => {
    if (expId) {
      setSelectedExperienceId(expId);
    }
    if (tab === 'visit-detail') {
      setFacultyTab('visit-detail');
    } else if (tab === 'experiences' || tab === 'my-experiences') {
      setFacultyTab('my-experiences');
      setFacultyCreateOpen(false);
    } else if (tab === 'create-experience') {
      setFacultyTab('my-experiences');
      setFacultyCreateOpen(true);
    } else {
      setFacultyTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#0B2545] selection:text-white">
      {/* 1. Global Institutional Header */}
      <Header
        onOpenAssistant={() => setIsAssistantOpen(true)}
        unreadCount={unreadNotificationsCount}
        onNavigateToProfile={(isEdit = false) => {
          setIsEditingProfile(isEdit);
          if (role === 'STUDENT') setStudentTab('profile');
          if (role === 'FACULTY') setFacultyTab('profile');
          if (role === 'ADMIN') setAdminTab('profile');
        }}
        onNavigateToSettings={() => {
          if (role === 'ADMIN') setAdminTab('settings');
          if (role === 'STUDENT') setStudentTab('settings');
          if (role === 'FACULTY') setFacultyTab('settings');
        }}
        onGlobalSearch={(query) => {
          if (role === 'STUDENT') setStudentTab('explore');
          if (role === 'FACULTY') setFacultyTab('my-experiences');
          if (role === 'ADMIN') setAdminTab('experiences');
        }}
        onSelectExperience={(expId) => {
          if (role === 'STUDENT') {
            handleStudentNavigate('experience-detail', expId);
          } else if (role === 'FACULTY') {
            handleFacultyNavigate('my-experiences', expId);
          }
        }}
      />

      {/* 2. Main Portal Body (Sidebar + Content Canvas) */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Role Specific Sidebar */}
        {role === 'STUDENT' && (
          <StudentSidebar
            activeTab={studentTab}
            onSelectTab={(tab) => {
              if (tab !== 'experience-detail') {
                setSelectedExperienceId(null);
              }
              setStudentTab(tab);
            }}
            unreadCount={unreadNotificationsCount}
          />
        )}

        {role === 'FACULTY' && (
          <FacultySidebar
            activeTab={facultyTab}
            onSelectTab={(tab) => {
              setSelectedExperienceId(null);
              setFacultyTab(tab);
            }}
          />
        )}

        {role === 'ADMIN' && (
          <AdminSidebar
            activeTab={adminTab}
            onSelectTab={(tab) => setAdminTab(tab)}
          />
        )}

        {/* 3. Main Workspace Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-4rem)] bg-slate-50">
          {/* Public Certificate Verification View */}
          {verifyCertId ? (
            <CertificateVerificationView
              certificateId={verifyCertId}
              onBack={() => {
                setVerifyCertId(null);
                window.history.replaceState({}, '', window.location.pathname);
              }}
            />
          ) : (
            <>
              {/* STUDENT ROUTES */}
              {role === 'STUDENT' && (
            <>
              {studentTab === 'home' && (
                <StudentHome
                  onNavigate={handleStudentNavigate}
                  onOpenBoardingPass={(exp) => setActiveBoardingPassExp(exp)}
                />
              )}

              {studentTab === 'explore' && (
                <StudentExplore
                  onSelectExperience={(expId) => {
                    setSelectedExperienceId(expId);
                    setStudentTab('experience-detail');
                  }}
                />
              )}

              {studentTab === 'experience-detail' && selectedExperienceId && (
                <StudentExperienceDetail
                  experienceId={selectedExperienceId}
                  onBack={() => setStudentTab('explore')}
                  onRefreshStudent={refreshAuth}
                />
              )}

              {studentTab === 'my-experiences' && (
                <StudentMyExperiences
                  onSelectExperience={(expId) => {
                    setSelectedExperienceId(expId);
                    setStudentTab('experience-detail');
                  }}
                  onExploreClick={() => setStudentTab('explore')}
                />
              )}

              {studentTab === 'notifications' && (
                <StudentNotifications
                  onNavigateToExperience={(expId) => {
                    setSelectedExperienceId(expId);
                    setStudentTab('experience-detail');
                  }}
                />
              )}

              {studentTab === 'leaves' && <StudentLeaveApplication />}

              {studentTab === 'profile' && <StudentProfileView isEditing={isEditingProfile} />}
              {studentTab === 'settings' && <UserSettings />}
            </>
          )}

          {/* FACULTY ROUTES */}
          {role === 'FACULTY' && (
            <>
              {facultyTab === 'dashboard' && (
                <FacultyDashboard
                  onNavigate={handleFacultyNavigate}
                />
              )}

              {facultyTab === 'my-experiences' && (
                <FacultyExperiences
                  onViewDetails={(expId) => {
                    setSelectedExperienceId(expId);
                    setFacultyVisitDetailTab('overview');
                    setFacultyTab('visit-detail');
                  }}
                  onViewDocuments={(expId) => {
                    setSelectedExperienceId(expId);
                    setFacultyVisitDetailTab('documents');
                    setFacultyTab('visit-detail');
                  }}
                  onMarkAttendance={(expId) => {
                    setSelectedExperienceId(expId);
                    setFacultyTab('attendance');
                  }}
                  onViewRoster={(expId) => {
                    setSelectedExperienceId(expId);
                    setFacultyTab('directory');
                  }}
                  onViewReports={(expId) => {
                    setSelectedExperienceId(expId);
                    setFacultyTab('reports');
                  }}
                  initialCreateOpen={facultyCreateOpen}
                />
              )}

              {facultyTab === 'visit-detail' && selectedExperienceId && (
                <FacultyVisitDetail
                  experienceId={selectedExperienceId}
                  initialTab={facultyVisitDetailTab}
                  onBack={() => {
                    setSelectedExperienceId(null);
                    setFacultyVisitDetailTab('overview');
                    setFacultyTab('my-experiences');
                  }}
                  onEdit={(exp) => {
                    setFacultyTab('my-experiences');
                  }}
                  onPreview={(exp) => {
                    setFacultyTab('my-experiences');
                  }}
                />
              )}

              {facultyTab === 'attendance' && (
                <FacultyAttendance initialExperienceId={selectedExperienceId || undefined} />
              )}

              {facultyTab === 'directory' && (
                <FacultyStudentDirectory initialExperienceId={selectedExperienceId || undefined} />
              )}

              {facultyTab === 'leaves' && <FacultyLeaveManagement />}

              {facultyTab === 'timetable' && (
                <FacultyTimetable
                  onSelectExperience={(expId) => {
                    setSelectedExperienceId(expId);
                    setFacultyTab('attendance');
                  }}
                />
              )}

              {facultyTab === 'reports' && (
                <FacultyReports
                  initialExperienceId={selectedExperienceId || undefined}
                  onSelectVisit={(expId) => {
                    setSelectedExperienceId(expId);
                    setFacultyTab('visit-detail');
                  }}
                />
              )}

              {facultyTab === 'profile' && <FacultyProfileView isEditing={isEditingProfile} />}
              {facultyTab === 'settings' && <UserSettings />}
            </>
          )}

          {/* ADMIN ROUTES */}
          {role === 'ADMIN' && (
            <>
              {adminTab === 'overview' && (
                <AdminOverview onNavigate={(tab) => setAdminTab(tab)} />
              )}

              {adminTab === 'faculty' && <AdminFacultyAccounts />}

              {adminTab === 'experiences' && <AdminAllExperiences selectedBlueprint={selectedBlueprint} clearSelectedBlueprint={() => setSelectedBlueprint(null)} onManageRegistration={(eId) => { setSelectedExperienceId(eId); setAdminTab('registrations'); }} />}

              {adminTab === 'students' && <AdminStudentDirectory />}

              {adminTab === 'registrations' && <AdminRegistrations />}

              {adminTab === 'attendance' && <AdminAttendance />}

              {adminTab === 'leaves' && <AdminLeaves />}

              {adminTab === 'documents' && <AdminDocuments />}

              {adminTab === 'emails' && <AdminEmailDeliveryLogs />}

              {adminTab === 'announcements' && <AdminAnnouncements />}

              {adminTab === 'users' && <AdminUsers />}

              
              {adminTab === 'security' && <SecurityEvents />}

              {adminTab === 'analytics' && (
                <AdminAnalytics
                  onSelectVisit={(expId) => {
                    setSelectedExperienceId(expId);
                    setAdminTab('experiences');
                  }}
                />
              )}

              {adminTab === 'settings' && <AdminSystemSettings />}
              {adminTab === 'profile' && <AdminProfile isEditing={isEditingProfile} />}

                          </>
          )}
            </>
          )}
        </main>
      </div>

      {/* VIT Assistant Modal */}
      <VitAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        currentExperienceId={selectedExperienceId || undefined}
      />

      {/* Verified Boarding Pass Modal */}
      {activeBoardingPassExp && activeBoardingPassExp.userBoardingPass && student && (
        <BoardingPassModal
          isOpen={!!activeBoardingPassExp}
          onClose={() => setActiveBoardingPassExp(null)}
          boardingPass={activeBoardingPassExp.userBoardingPass}
          experience={activeBoardingPassExp}
          student={student}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
