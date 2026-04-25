/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('wechatChatLog');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse chat log", e);
      }
    } else {
      setMessages([
        {
          id: Date.now().toString(),
          text: "Hello! I am your WeChat assistant. Send me a message and I will reply! 👋",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem('wechatChatLog', JSON.stringify(messages));
    }
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping, hasLoaded]);

  const generateResponse = async (text: string, history: ChatMessage[]) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, text })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch");
      }
      return data.reply || "Sorry, I couldn't understand that.";
    } catch (err) {
      console.error(err);
      return "Oops! I'm having trouble thinking right now. Please try again.";
    }
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);

    const botText = await generateResponse(trimmed, messages);
    
    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: botText,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem('wechatChatLog');
  };

  if (!hasLoaded) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f2f5] p-2 sm:p-6 font-sans text-[#1a1a1a] overflow-hidden select-none">
      <div className="w-full max-w-[1024px] h-[768px] grid grid-cols-12 grid-rows-6 gap-2 sm:gap-4">
        
        {/* PROFILE & STATUS CARD */}
        <div className="col-span-12 sm:col-span-3 row-span-1 bg-white rounded-3xl border-2 border-black p-4 flex items-center gap-4 hidden sm:flex">
          <div className="w-12 h-12 bg-[#07c160] rounded-xl flex items-center justify-center text-white font-bold text-xl">US</div>
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wider">User</h2>
            <p className="text-[10px] text-gray-500 font-mono">ID: wechat_sim_88</p>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[#07c160]"></div>
          </div>
        </div>

        {/* SEARCH & ACTIONS */}
        <div className="col-span-12 sm:col-span-6 row-span-1 bg-white rounded-3xl border-2 border-black p-4 flex items-center justify-between hidden sm:flex">
          <div className="flex items-center gap-3 text-gray-400 w-full">
            <span className="text-lg">🔍</span>
            <span className="text-sm font-medium">Search messages, people, or groups...</span>
          </div>
          <div className="flex items-center gap-4 border-l pl-4">
            <span className="text-xl opacity-60">➕</span>
            <span className="text-xl opacity-60">👤</span>
          </div>
        </div>

        {/* SETTINGS / SYSTEM */}
        <div className="col-span-12 sm:col-span-3 row-span-1 bg-[#1a1a1a] rounded-3xl p-4 flex flex-col justify-center text-white hidden sm:flex">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono opacity-50 uppercase">System Load</span>
            <span className="text-[10px] font-mono text-[#07c160]">Optimized</span>
          </div>
          <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-[#07c160]"></div>
          </div>
        </div>

        {/* CONVERSATION LIST */}
        <div className="col-span-12 sm:col-span-3 row-span-5 bg-white rounded-3xl border-2 border-black overflow-hidden flex flex-col hidden sm:flex">
          <div className="p-4 border-b-2 border-black bg-gray-50">
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Recent Chats</h3>
          </div>
          <div className="flex-1">
            <div className="p-4 flex items-center gap-3 bg-[#07c160]/10 border-l-4 border-[#07c160]">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-xs">US</div>
              <div className="flex-1">
                <div className="flex justify-between"><span className="text-xs font-bold">Simulator</span><span className="text-[9px] opacity-50">Now</span></div>
                <p className="text-[11px] text-gray-500 truncate">Bot active...</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-lg"></div>
              <div className="flex-1">
                <div className="flex justify-between"><span className="text-xs font-bold">Design Team</span><span className="text-[9px] opacity-50">12:05</span></div>
                <p className="text-[11px] text-gray-500 truncate">Sarah: The bento looks great!</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-orange-100 rounded-lg"></div>
              <div className="flex-1">
                <div className="flex justify-between"><span className="text-xs font-bold">Moments</span><span className="text-[9px] opacity-50">Yesterday</span></div>
                <p className="text-[11px] text-blue-600 truncate">New update from Mike...</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg"></div>
              <div className="flex-1">
                <div className="flex justify-between"><span className="text-xs font-bold">WeChat Pay</span><span className="text-[9px] opacity-50">2 days ago</span></div>
                <p className="text-[11px] text-gray-500 truncate">Payment successful: $12.50</p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CHAT WINDOW */}
        <div className="col-span-12 sm:col-span-6 row-span-6 flex-1 sm:row-span-5 bg-white rounded-3xl border-2 border-black flex flex-col overflow-hidden relative">
          <div className="p-4 border-b-2 border-black flex justify-between items-center z-10 bg-white">
            <div>
              <h2 className="font-bold text-lg">WeChat Simulator</h2>
              <p className="text-[10px] text-[#07c160] font-bold uppercase tracking-widest">Online • Mobile</p>
            </div>
            <div className="flex gap-4 items-center">
              <span className="grayscale opacity-60">📞</span>
              <span className="grayscale opacity-60">📹</span>
              <span className="grayscale opacity-60">⋯</span>
              <button onClick={handleClear} className="opacity-60 hover:opacity-100 hover:text-red-500 transition-colors ml-2" title="Clear chat">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-[#f3f3f3] p-4 sm:p-6 space-y-6 overflow-y-auto" ref={chatAreaRef}>
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const showTimestamp = index === 0 || 
                  (new Date(`1970/01/01 ${msg.timestamp}`).getTime() - new Date(`1970/01/01 ${messages[index-1].timestamp}`).getTime() > 60000 * 5);
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex flex-col gap-2"
                  >
                    {showTimestamp && (
                      <div className="flex justify-center my-2">
                        <span className="text-[10px] text-gray-400 bg-gray-200/50 px-3 py-1 rounded-full">{msg.timestamp}</span>
                      </div>
                    )}
                    <div className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                      {msg.sender === 'bot' && <div className="w-8 h-8 bg-gray-300 rounded flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-600">Bot</div>}
                      <div className={`p-3 rounded-lg border text-sm max-w-[70%] break-words
                        ${msg.sender === 'user' 
                          ? 'bg-[#95ec69] border-[#83d45a]' 
                          : 'bg-white border-gray-200'}`}
                      >
                        {msg.text}
                      </div>
                      {msg.sender === 'user' && <div className="w-8 h-8 bg-[#07c160] rounded flex-shrink-0 flex items-center justify-center font-bold text-xs text-white">US</div>}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 bg-gray-300 rounded flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-600">Bot</div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-1.5 h-10">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </motion.div>
            )}
          </div>
          <div className="p-4 bg-white border-t-2 border-black flex flex-col gap-2 z-10 w-full relative">
            <div className="flex gap-4 text-xl opacity-60 px-2">
              <span>😀</span><span>🖼️</span><span>📂</span><span>✂️</span>
            </div>
            <div className="flex gap-3 items-center">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 h-12 min-h-[48px] max-h-32 bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#07c160] resize-none overflow-y-auto"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="h-12 px-6 bg-[#07c160] text-white rounded-xl font-bold flex items-center justify-center border-b-4 border-green-800 disabled:opacity-50 disabled:border-transparent transition-all active:border-b-0 active:translate-y-1"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - MEDIA & TOOLS */}
        <div className="col-span-12 sm:col-span-3 row-span-3 bg-white rounded-3xl border-2 border-black p-4 flex flex-col hidden sm:flex">
          <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4">Media & Files</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div className="aspect-square bg-gray-300 rounded-lg flex items-center justify-center text-xs font-bold">+12</div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl border border-transparent">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500 font-bold text-[10px]">PDF</div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">Project_Specs_V2.pdf</p>
                <p className="text-[10px] text-gray-400">2.4 MB • 2h ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 font-bold text-[10px]">DOC</div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">Meeting_Notes.docx</p>
                <p className="text-[10px] text-gray-400">156 KB • Yesterday</p>
              </div>
            </div>
          </div>
        </div>

        {/* MINI APPS / FAVORITES */}
        <div className="col-span-12 sm:col-span-3 row-span-2 bg-white rounded-3xl border-2 border-black p-4 hidden sm:block">
          <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4">Miniapps</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full border-2 border-black bg-yellow-400"></div>
              <span className="text-[9px] font-bold">Deliver</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full border-2 border-black bg-blue-400"></div>
              <span className="text-[9px] font-bold">Health</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full border-2 border-black bg-red-400"></div>
              <span className="text-[9px] font-bold">Tickets</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-100"></div>
              <span className="text-[9px] font-bold">More</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
