import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let newSocket = null;

    if (isAuthenticated && token) {
      newSocket = io(window.location.origin, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('[SocketClient] Connected to server with ID:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.warn('[SocketClient] Connection error:', err.message);
      });

      setSocket(newSocket);
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  const joinTicket = (ticketId) => {
    if (socket && ticketId) {
      socket.emit('join-ticket', { ticketId });
    }
  };

  const leaveTicket = (ticketId) => {
    if (socket && ticketId) {
      socket.emit('leave-ticket', { ticketId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinTicket, leaveTicket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
