import { createContext, useState, useCallback } from 'react';
import api from '../api/axios';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/profile');
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}