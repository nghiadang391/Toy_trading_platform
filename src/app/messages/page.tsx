"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";

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
  const { user, connectWallet, connecting } = useUser();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fallback demo user ID if not logged in yet
  const fallbackUserId = "cmslwc9bl0001oerq542iln7o";
  const currentUserId = user?.id || fallbackUserId;

  // Fetch active chat rooms
  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch(`/api/chat/rooms?userId=${currentUserId}`);
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
  }, [currentUserId, activeRoom]);

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

  async function sendMsg(content: string) {
    const roomId = activeRoom?.id;
    if (!content.trim() || !roomId) return;

    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUserId,
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = newMsg;
    setNewMsg(""); // Clear immediately for UX
    await sendMsg(content);
  }

  const suggestions = [
    "Sản phẩm này còn không ạ? / Is this item still available?",
    "Bạn có thể chụp thêm ảnh không? / Can you send more photos?",
    "Địa chỉ giao dịch ở đâu vậy bạn? / Where can we meet?"
  ];

  return (
    <div className="inbox-container">
      {/* Sidebar: Chat List */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Conversations</h2>
          {!user && (
            <button 
              onClick={() => connectWallet()} 
              disabled={connecting}
              className="connect-badge-btn"
            >
              {connecting ? "Connecting..." : "🔑 Connect JoyID"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="status-text">Loading chats...</div>
        ) : rooms.length === 0 ? (
          <div className="status-text">No active chats. Start one from the browse page!</div>
        ) : (
          <div className="rooms-list">
            {rooms.map((room) => {
              const isBuyer = room.buyer.id === currentUserId;
              const partnerName = isBuyer ? room.seller.displayName : room.buyer.displayName;
              const toyTitle = room.listing?.title || "Direct Message";
              const lastMsg = room.messages?.[0]?.content || "No messages yet";

              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={`room-item ${activeRoom?.id === room.id ? "active" : ""}`}
                >
                  <div className="room-avatar">🧸</div>
                  <div className="room-info">
                    <div className="room-header">
                      <span className="partner-name">{partnerName}</span>
                      <span className="role-tag">{isBuyer ? "Seller" : "Buyer"}</span>
                    </div>
                    <span className="room-toy-title">{toyTitle}</span>
                    <p className="room-last-msg">{lastMsg}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {activeRoom ? (
          <>
            <div className="chat-header">
              <div>
                <h3>{activeRoom.buyer.id === currentUserId ? activeRoom.seller.displayName : activeRoom.buyer.displayName}</h3>
                <p>{activeRoom.listing?.title || "Direct Trade Discussion"}</p>
              </div>
              <Link href="/listings" className="back-link">
                Browse More Toys →
              </Link>
            </div>

            <div className="messages-area">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet. Send a greeting to start chatting!</p>
                  <div className="quick-suggestions">
                    {suggestions.map((text, idx) => (
                      <button key={idx} onClick={() => sendMsg(text)} className="suggestion-btn">
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === currentUserId;
                  return (
                    <div key={m.id} className={`message-row ${isMe ? "me" : "them"}`}>
                      <div className="message-bubble">
                        <p className="message-text">{m.content}</p>
                        <span className="message-time">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="chat-input-row">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                className="message-input"
              />
              <button type="submit" disabled={!newMsg.trim()} className="send-btn">
                Send ✈️
              </button>
            </form>
          </>
        ) : (
          <div className="no-active-room">
            <p>Select a conversation from the left to start messaging.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .inbox-container {
          max-width: 1200px;
          margin: 40px auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          height: calc(100vh - 160px);
          min-height: 550px;
          font-family: Inter, sans-serif;
        }
        @media (max-width: 768px) {
          .inbox-container {
            grid-template-columns: 1fr;
            height: auto;
          }
        }
        .sidebar {
          background: #141a20;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sidebar-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sidebar-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .connect-badge-btn {
          background: rgba(0, 255, 135, 0.1);
          border: 1px solid rgba(0, 255, 135, 0.3);
          color: #00ff87;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
        }
        .status-text {
          padding: 32px 20px;
          text-align: center;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .rooms-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .room-item {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: none;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
          color: #ffffff;
        }
        .room-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .room-item.active {
          background: rgba(0, 255, 135, 0.08);
          border-left: 3px solid #00ff87;
        }
        .room-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .room-info {
          flex: 1;
          min-width: 0;
        }
        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }
        .partner-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .role-tag {
          font-size: 0.65rem;
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.7);
        }
        .room-toy-title {
          font-size: 0.75rem;
          color: #60efff;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }
        .room-last-msg {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }

        .chat-main {
          background: #141a20;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chat-header {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
        }
        .chat-header h3 {
          margin: 0 0 2px 0;
          font-size: 1.1rem;
          font-weight: 700;
        }
        .chat-header p {
          margin: 0;
          font-size: 0.8rem;
          color: #60efff;
        }
        .back-link {
          font-size: 0.85rem;
          color: #00ff87;
          text-decoration: none;
        }
        .messages-area {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .no-messages {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          padding: 40px 20px;
        }
        .quick-suggestions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        .suggestion-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .suggestion-btn:hover {
          background: rgba(0, 255, 135, 0.1);
          border-color: #00ff87;
        }
        .message-row {
          display: flex;
        }
        .message-row.me {
          justify-content: flex-end;
        }
        .message-row.them {
          justify-content: flex-start;
        }
        .message-bubble {
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 12px;
          position: relative;
        }
        .message-row.me .message-bubble {
          background: linear-gradient(135deg, rgba(0, 255, 135, 0.25) 0%, rgba(96, 239, 255, 0.25) 100%);
          border: 1px solid rgba(0, 255, 135, 0.4);
          color: #ffffff;
          border-bottom-right-radius: 2px;
        }
        .message-row.them .message-bubble {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border-bottom-left-radius: 2px;
        }
        .message-text {
          margin: 0 0 4px 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        .message-time {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.45);
          display: block;
          text-align: right;
        }
        .chat-input-row {
          padding: 14px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          gap: 10px;
          background: rgba(255, 255, 255, 0.01);
        }
        .message-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 10px 14px;
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.9rem;
          outline: none;
        }
        .message-input:focus {
          border-color: #00ff87;
        }
        .send-btn {
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          border: none;
          color: #0a0a0a;
          font-weight: 700;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .no-active-room {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}
