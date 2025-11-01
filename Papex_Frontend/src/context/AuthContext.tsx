import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

interface UserProfile {
  id?: string | number;
  email?: string;
  role?: string;
  verified?: boolean;
  orcid?: string | null;
}

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  setUser: (profile: UserProfile | null) => void;
  setToken: (value: string | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      setUser,
      setToken,
      logout,
      isAuthenticated: Boolean(user && token),
    }),
    [user, token],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
