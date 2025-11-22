import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { User, Cpu, Globe, Paperclip, Loader2, Brain } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-8 max-w-3xl mx-auto w-full pb-32">
      {messages.map((msg) => (
        <div key={msg.id} className="flex gap-4 animate-fadeIn">
          <div className="flex-shrink-0 mt-1">
            {msg.role === Role.USER ? (
              <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-gray-300">
                <User size={16} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                <Cpu size={16} />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-200">
                {msg.role === Role.USER ? 'You' : 'DeepSearch'}
              </span>
              
              {/* Badges for AI message type */}
              {msg.role === Role.MODEL && msg.isThinking && (
                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                   <Brain size={10} /> Reasoned
                </span>
              )}
              {msg.role === Role.MODEL && msg.isSearch && (
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
                   <Globe size={10} /> Searched
                </span>
              )}
              
              <span className="text-xs text-gray-500 ml-auto">
                 {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Attachments Display for User */}
            {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                    {msg.attachments.map((att, idx) => (
                        <div key={idx} className="relative group">
                            {att.mimeType.startsWith('image') ? (
                                <img 
                                    src={`data:${att.mimeType};base64,${att.data}`} 
                                    alt="User upload" 
                                    className="h-32 w-auto rounded-lg border border-[#333] object-cover"
                                />
                            ) : (
                                <div className="h-16 w-32 bg-[#2d2d2d] rounded-lg border border-[#333] flex items-center justify-center gap-2 text-gray-400">
                                    <Paperclip size={16} />
                                    <span className="text-xs truncate max-w-[80px]">{att.name}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="text-gray-300 text-sm leading-relaxed markdown-body">
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>

            {/* Grounding/Sources Display */}
            {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#2d2d2d]">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                        <Globe size={12} /> Sources
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.groundingChunks.map((chunk, idx) => {
                            if (!chunk.web) return null;
                            return (
                                <a 
                                    key={idx} 
                                    href={chunk.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block p-2 bg-[#1e1e1e] hover:bg-[#262626] rounded border border-[#2d2d2d] transition-colors"
                                >
                                    <div className="text-xs font-medium text-teal-400 truncate">{chunk.web.title}</div>
                                    <div className="text-[10px] text-gray-500 truncate">{new URL(chunk.web.uri).hostname}</div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="flex gap-4 animate-pulse">
           <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
             <Cpu size={16} />
           </div>
           <div className="flex items-center gap-2 text-gray-500 text-sm pt-1">
             <Loader2 size={14} className="animate-spin" />
             <span>Thinking...</span>
           </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;