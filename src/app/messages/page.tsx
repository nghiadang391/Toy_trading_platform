"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    displayName: string;
  };
}

interface ChatRoom {
  id: string;
  listingId: string | null;
  listing: { title: string } | null;
  buyer: { id: string; displayName: string };
  seller: { id: string; displayName: string };
  messages: Message[];
}

export default function MessagesPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulated logged-in parent user ID
  const dummyUserId = "cmslwc9bl0001oerq542iln7o";

  // Fetch active chat rooms
  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch(`/api/chat/rooms?userId=${dummyUserId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setRooms(data);
          // Auto-select first room if none is active
          if (data.length > 0 && !activeRoom) {
            setActiveRoom(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load chat rooms:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
    const interval = setInterval(fetchRooms, 6000); // refresh list every 6s
    return () => clearInterval(interval);
  }, [dummyUserId, activeRoom]);

  // Fetch messages for active chat room
  useEffect(() => {
    const roomId = activeRoom?.id;
    if (!roomId) return;
    setMessages([]);

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    }

    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, 3000); // poll messages every 3s
    return () => clearInterval(interval);
  }, [activeRoom?.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const roomId = activeRoom?.id;
    if (!newMsg.trim() || !roomId) return;

    const content = newMsg;
    setNewMsg(""); // Clear immediately for UX

    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: dummyUserId,
          content,
        }),
      });

      const msg = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, msg]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }

  return (
    <div className="inbox-container">
      {/* Sidebar: Chat List */}
      <div className="sidebar">
        <h2 className="sidebar-title">Conversations</h2>
        {loading ? (
          <div className="status-text">Loading chats...</div>
        ) : rooms.length === 0 ? (
          <div className="status-text">No active chats. Start one from the browse page!</div>
        ) : (
          <div className="rooms-list">
            {rooms.map((room) => {
              const isBuyer = room.buyer.id === dummyUserId;
              const partnerName = isBuyer ? room.seller.displayName : room.buyer.displayName;
              const toyTitle = room.listing?.title || "Direct Message";
              const lastMsg = room.messages?.[0]?.content || "No messages yet";

              return (
                <button
                  key={room.id}
                  className={`room-item ${activeRoom?.id === room.id ? "active" : ""}`}
                  onClick={() => setActiveRoom(room)}
                >
                  <div className="room-meta">
                    <span className="room-partner">{partnerName}</span>
                    <span className="room-toy">{toyTitle}</span>
                  </div>
                  <p className="room-last-msg">{lastMsg}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main chat window */}
      <div className="chat-window">
        {activeRoom ? (
          <>
            {/* Header */}
            <div className="chat-header">
              <h3>
                {activeRoom.buyer.id === dummyUserId
                  ? activeRoom.seller.displayName
                  : activeRoom.buyer.displayName}
              </h3>
              <span className="chat-toy-tag">{activeRoom.listing?.title || "General Inquiry"}</span>
            </div>

            {/* Messages body */}
            <div className="chat-body">
              {messages.length === 0 ? (
                <div className="chat-empty">No messages yet. Start the discussion!</div>
              ) : (
                <div className="messages-list">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === dummyUserId;
                    return (
                      <div key={msg.id} className={`message-wrapper ${isMe ? "me" : "them"}`}>
                        <div className="message-bubble">
                          <p className="message-text">{msg.content}</p>
                          <span className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input footer */}
            <form onSubmit={handleSend} className="chat-footer">
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type your message here..."
              />
              <button type="submit" className="send-btn" disabled={!newMsg.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-state">
            <p>Select a conversation from the sidebar to view messages.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .inbox-container {
          display: flex;
          height: calc(100vh - 72px);
          max-width: 1200px;
          margin: 0 auto;
          background: #0d0d0d;
          border-left: 1px solid rgba(255, 255, 255, 0.08);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          font-family: Inter, sans-serif;
        }
        .sidebar {
          width: 320px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
        }
        .sidebar-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .status-text {
          padding: 24px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9rem;
          text-align: center;
        }
        .rooms-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .room-item {
          padding: 16px 24px;
          border: none;
          background: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .room-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .room-item.active {
          background: rgba(255, 255, 255, 0.05);
          border-left: 3px solid #00ff87;
        }
        .room-meta {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .room-partner {
          font-weight: 700;
          color: #ffffff;
          font-size: 0.95rem;
        }
        .room-toy {
          font-size: 0.75rem;
          color: #60efff;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .room-last-msg {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .chat-window {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.01);
        }
        .chat-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chat-header h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: #ffffff;
        }
        .chat-toy-tag {
          font-size: 0.75rem;
          color: #00ff87;
          background: rgba(0, 255, 135, 0.08);
          border: 1px solid rgba(0, 255, 135, 0.2);
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 700;
        }
        .chat-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }
        .chat-empty, .chat-empty-state {
          margin: auto;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.95rem;
          text-align: center;
        }
        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .message-wrapper {
          display: flex;
          width: 100%;
        }
        .message-wrapper.me {
          justify-content: flex-end;
        }
        .message-wrapper.them {
          justify-content: flex-start;
        }
        .message-bubble {
          max-width: 65%;
          padding: 10px 14px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .message-wrapper.me .message-bubble {
          background: #00ff87;
          color: #0a0a0a;
          border-bottom-right-radius: 4px;
        }
        .message-wrapper.them .message-bubble {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .message-text {
          font-size: 0.9rem;
          line-height: 1.4;
          word-break: break-word;
        }
        .message-time {
          font-size: 0.7rem;
          align-self: flex-end;
          opacity: 0.6;
        }
        .chat-footer {
          padding: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          gap: 12px;
          background: #090909;
        }
        .chat-footer input {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          outline: none;
        }
        .chat-footer input:focus {
          border-color: #00ff87;
        }
        .send-btn {
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          border: none;
          color: #0a0a0a;
          padding: 0 24px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: opacity 0.2s;
        }
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
