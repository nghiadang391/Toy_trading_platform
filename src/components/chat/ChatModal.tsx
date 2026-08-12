"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface ChatModalProps {
  listingId: string | null;
  buyerId: string;
  sellerId: string;
  sellerName: string;
  toyTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    displayName: string;
  };
}

export default function ChatModal({
  listingId,
  buyerId,
  sellerId,
  sellerName,
  toyTitle,
  isOpen,
  onClose,
}: ChatModalProps) {
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Initialize or fetch the ChatRoom
  useEffect(() => {
    if (!isOpen) return;
    setRoom(null);
    setMessages([]);

    async function initChatRoom() {
      try {
        const res = await fetch("/api/chat/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId,
            buyerId,
            sellerId,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setRoom(data);
        }
      } catch (err) {
        console.error("Failed to initialize chat room:", err);
      }
    }

    initChatRoom();
  }, [isOpen, listingId, buyerId, sellerId]);

  // Poll for new messages every 3 seconds when room is ready
  useEffect(() => {
    if (!isOpen || !room?.id) return;

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat/rooms/${room.id}/messages`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    }

    fetchMessages(); // Initial fetch

    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, room?.id]);

  // Auto-scroll to the bottom of the chat stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMsg(content: string) {
    if (!content.trim() || !room?.id) return;

    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: buyerId,
          content,
        }),
      });

      const message = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, message]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = newMsg;
    setNewMsg(""); // Clear input immediately for better UX
    await sendMsg(content);
  }

  if (!isOpen) return null;

  const suggestions = [
    t("suggestion1"),
    t("suggestion2"),
    t("suggestion3"),
  ];

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-header">
          <div className="header-meta">
            <span className="toy-title">{toyTitle}</span>
            <h2 className="seller-name">{t("chattingWith")} {sellerName}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Messages Body */}
        <div className="chat-body">
          {!room ? (
            <div className="chat-loader">{t("connectingPrivateChannel")}</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <p>{t("noMessagesYet")}</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg) => {
                const isMe = msg.senderId === buyerId;
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

        {/* Quick Suggestions list */}
        {room && (
          <div className="suggestions-bar">
            {suggestions.map((text, idx) => (
              <button key={idx} className="suggestion-pill" onClick={() => sendMsg(text)}>
                {text}
              </button>
            ))}
          </div>
        )}

        {/* Message Input Footer */}
        <form onSubmit={handleSend} className="chat-footer">
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder={t("typeMessageHere")}
            disabled={!room}
          />
          <button type="submit" className="send-btn" disabled={!room || !newMsg.trim()}>
            {t("send")}
          </button>
        </form>
      </div>

      <style jsx>{`
        .chat-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          justify-content: flex-end;
        }
        .chat-content {
          background: #121212;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 420px;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
          font-family: Inter, sans-serif;
        }
        .chat-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .toy-title {
          font-size: 0.75rem;
          color: #60efff;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .seller-name {
          font-size: 1.1rem;
          font-weight: 800;
          color: #ffffff;
          margin-top: 4px;
        }
        .close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.25rem;
          cursor: pointer;
          transition: color 0.2s;
        }
        .close-btn:hover {
          color: #ffffff;
        }
        .chat-body {
          flex-grow: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .chat-loader, .chat-empty {
          margin: auto;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.95rem;
        }
        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          max-width: 75%;
          padding: 12px 16px;
          border-radius: 16px;
          position: relative;
        }
        .me .message-bubble {
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          color: #0a0a0a;
          border-bottom-right-radius: 4px;
        }
        .them .message-bubble {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border-bottom-left-radius: 4px;
        }
        .message-text {
          font-size: 0.95rem;
          line-height: 1.4;
          margin: 0;
          word-break: break-word;
        }
        .message-time {
          font-size: 0.7rem;
          display: block;
          margin-top: 4px;
          text-align: right;
          opacity: 0.6;
        }
        .suggestions-bar {
          padding: 12px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(255, 255, 255, 0.02);
        }
        .suggestion-pill {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.8);
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .suggestion-pill:hover {
          background: rgba(0, 255, 135, 0.1);
          border-color: rgba(0, 255, 135, 0.3);
          color: #00ff87;
          transform: translateX(2px);
        }
        .chat-footer {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          gap: 12px;
        }
        .chat-footer input {
          flex-grow: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 12px;
          color: #ffffff;
          font-size: 0.95rem;
        }
        .chat-footer input:focus {
          outline: none;
          border-color: #00ff87;
        }
        .send-btn {
          background: #00ff87;
          color: #0a0a0a;
          border: none;
          padding: 0 20px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .send-btn:hover:not(:disabled) {
          opacity: 0.9;
        }
        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
