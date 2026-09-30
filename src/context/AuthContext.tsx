import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, StudentProfile, FacultyProfile, UserRole } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  student: StudentProfile | null;
  faculty: FacultyProfile | null;
  role: UserRole | null;
  loading: boolean;
  unreadNotificationCount: number;
  login: (data: { identifier?: string; email?: string; password?: string; role?: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  quickSwitchRole: (targetRole: UserRole) => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; department?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [faculty, setFaculty] = useState<FacultyProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setStudent(res.student || null);
      setFaculty(res.faculty || null);
      setUnreadNotificationCount(res.unreadNotificationCount || 0);
    } catch (err) {
      console.warn('Authentication token invalid or expired');
      setUser(null);
      setStudent(null);
      setFaculty(null);
      removeAuthToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      refreshAuth();
    } else {
      setUser(null);
      setStudent(null);
      setFaculty(null);
      setLoading(false);
    }
  }, [refreshAuth]);

  const login = async (data: { identifier?: string; email?: string; password?: string; role?: string }) => {
    setLoading(true);
    try {
      const res = await api.login(data);
      setAuthToken(res.token);
      setUser(res.user);
      setStudent(res.student || null);
      setFaculty(res.faculty || null);
      const meRes = await api.getMe();
      setUnreadNotificationCount(meRes.unreadNotificationCount || 0);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      removeAuthToken();
      setUser(null);
      setStudent(null);
      setFaculty(null);
      setUnreadNotificationCount(0);
    }
  };

  const switchUser = async (userId: string) => {
    setLoading(true);
    try {
      const res = await api.switchUser(userId);
      setAuthToken(res.token);
      setUser(res.user);
      setStudent(res.student || null);
      setFaculty(res.faculty || null);
      const meRes = await api.getMe();
      setUnreadNotificationCount(meRes.unreadNotificationCount || 0);
    } finally {
      setLoading(false);
    }
  };

  const quickSwitchRole = async (targetRole: UserRole) => {
    let targetUserId = 'usr_student_1';
    if (targetRole === 'FACULTY') targetUserId = 'usr_faculty_1';
    if (targetRole === 'ADMIN') targetUserId = 'usr_admin_1';
    await switchUser(targetUserId);
  };

  
  const updateProfile = async (data: { name?: string; phone?: string; department?: string }) => {
    setLoading(true);
    try {
      const res = await api.updateMyProfile(data);
      setUser(res.user);
      if (res.student) setStudent(res.student);
      if (res.faculty) setFaculty(res.faculty);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        student,
        faculty,
        role: user?.role || null,
        loading,
        unreadNotificationCount,
        login,
        logout,
        switchUser,
        quickSwitchRole,
        refreshAuth,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
