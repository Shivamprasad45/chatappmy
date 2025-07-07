"use client";
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

interface Message {
  name: string;
  message: string;
}

const socket = io("http://localhost:5000");

const ChatUI: React.FC = () => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    socket.on("receive_message", (data: Message) => {
      setChatLog((prev) => [...prev, data]);
    });

    socket.on("typing", (username: string) => {
      setIsTyping(username);
    });

    socket.on("stop_typing", () => {
      setIsTyping(null);
    });

    socket.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("online_users");
    };
  }, []);

  useEffect(() => {
    if (name) {
      socket.emit("register_user", name);
    }
  }, [name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, isTyping]);

  const sendMessage = () => {
    if (!name || !message) return;

    socket.emit("send_message", { name, message });
    setMessage("");
  };

  const handleTyping = () => {
    socket.emit("typing", name);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", name);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">🌿 Realtime Chat</h2>
          <div className="text-sm">
            👥 Online:{" "}
            <span className="font-semibold">{onlineUsers.length}</span>
          </div>
        </div>

        {/* Online Users */}
        <div className="px-4 py-2 border-b">
          <p className="text-gray-700 text-sm mb-1 font-semibold">
            Online Users:
          </p>
          <div className="flex gap-2 flex-wrap text-sm text-green-700">
            {onlineUsers.map((user, idx) => (
              <span
                key={idx}
                className="bg-green-100 px-2 py-1 rounded-full shadow-sm"
              >
                {user}
              </span>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
          {chatLog.map((msg, idx) => {
            const isOwn = msg.name === name;
            return (
              <div
                key={idx}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                    isOwn
                      ? "bg-blue-500 text-white self-end"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <p className="text-sm font-semibold">{msg.name}</p>
                  <p>{msg.message}</p>
                </div>
              </div>
            );
          })}
          {isTyping && isTyping !== name && (
            <p className="text-sm text-gray-500 italic animate-pulse">
              ✍️ {isTyping} is typing...
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Inputs */}
        <div className="border-t p-4 bg-white flex flex-col gap-2">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter your message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
