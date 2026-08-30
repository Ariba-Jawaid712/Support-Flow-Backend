import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, User, Shield, Headphones } from 'lucide-react';
import { messageService } from '../../services/messageService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export const ConversationBox = ({ ticketId, isClosed = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const { socket, joinTicket, leaveTicket } = useSocket();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const res = await messageService.getMessages(ticketId);
        if (isMounted) {
          setMessages(res.messages || []);
        }
      } catch (err) {
        console.error('Failed to load ticket messages:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (ticketId) {
      loadMessages();
      joinTicket(ticketId);
    }

    return () => {
      isMounted = false;
      if (ticketId) {
        leaveTicket(ticketId);
      }
    };
  }, [ticketId]);

  useEffect(() => {
    if (!socket || !ticketId) return;

    const handleNewMessage = (msg) => {
      if (msg.ticket === ticketId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await messageService.sendMessage(ticketId, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-container">
      <div
        style={{
          padding: '0.85rem 1.25rem',
          background: 'var(--bg-alt)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 700,
          fontSize: '0.9rem',
          color: 'var(--text-primary)',
        }}
      >
        <MessageSquare size={16} color="var(--primary)" />
        <span>Request Conversation</span>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <p style={{ fontSize: '0.9rem' }}>No messages exchanged yet.</p>
            <p style={{ fontSize: '0.78rem' }}>Type a message below to begin direct communication.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.sender?._id === user?._id || m.sender === user?._id;
            return (
              <div
                key={m._id}
                className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}
              >
                <div className="chat-sender">
                  {m.sender?.name || (isMine ? 'You' : 'Support')} •{' '}
                  <span style={{ textTransform: 'capitalize', opacity: 0.9 }}>
                    ({m.senderRole})
                  </span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                <div className="chat-time">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          className="form-control"
          placeholder={isClosed ? 'This request is finalized' : 'Type your message...'}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isClosed || sending}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!newMessage.trim() || sending || isClosed}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
