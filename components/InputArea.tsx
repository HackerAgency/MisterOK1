import React, { useState, useRef } from 'react';
import { ArrowRight, Paperclip, Globe, Brain, X, Image as ImageIcon, FileText } from 'lucide-react';
import { Attachment } from '../types';
import { fileToAttachment } from '../services/geminiService';

interface InputAreaProps {
  onSend: (text: string, config: { useThinking: boolean; useSearch: boolean; attachments: Attachment[] }) => void;
  isLoading: boolean;
  variant?: 'centered' | 'bottom';
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading, variant = 'bottom' }) => {
  const [text, setText] = useState('');
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    
    onSend(text, {
      useThinking,
      useSearch,
      attachments
    });
    
    setText('');
    setAttachments([]);
    if(textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const newAttachments: Attachment[] = [];
        for (let i = 0; i < e.target.files.length; i++) {
            const file = e.target.files[i];
            try {
                const attachment = await fileToAttachment(file);
                newAttachments.push(attachment);
            } catch (err) {
                console.error("Failed to read file", err);
            }
        }
        setAttachments(prev => [...prev, ...newAttachments]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const wrapperClasses = variant === 'centered' 
    ? "w-full max-w-3xl mx-auto" 
    : "w-full max-w-3xl mx-auto pb-4";

  const bgClass = "bg-[#202023]";
  const borderClass = "border border-[#333]";

  return (
    <div className={`${wrapperClasses} relative z-20`}>
      <div className={`${bgClass} ${borderClass} rounded-[24px] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 focus-within:border-[#2dd4bf]/50 focus-within:ring-1 focus-within:ring-[#2dd4bf]/20`}>
        
        {/* Attachments Preview */}
        {attachments.length > 0 && (
            <div className="flex gap-2 px-4 pt-3 overflow-x-auto">
                {attachments.map((att, idx) => (
                    <div key={idx} className="relative flex items-center gap-2 bg-[#2d2d2d] px-3 py-1.5 rounded-lg text-xs text-gray-300 group shrink-0 border border-[#3f3f46]">
                        {att.mimeType.startsWith('image') ? <ImageIcon size={14} /> : <FileText size={14} />}
                        <span className="truncate max-w-[120px]">{att.name}</span>
                        <button onClick={() => removeAttachment(idx)} className="hover:text-red-400 ml-1">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="flex flex-col relative">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="w-full bg-transparent text-gray-100 px-4 py-4 resize-none outline-none min-h-[56px] max-h-[200px] placeholder-gray-500 text-base"
                rows={1}
            />

            <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <div className="flex items-center gap-2">
                    {/* Focus / Web Search Toggle */}
                    <button 
                        onClick={() => setUseSearch(!useSearch)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                            useSearch 
                            ? 'bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/30' 
                            : 'bg-[#2d2d2d] text-gray-400 hover:text-gray-200 border border-[#3f3f46] hover:bg-[#3f3f46]'
                        }`}
                    >
                        <Globe size={14} />
                        <span>Search</span>
                    </button>

                    {/* Thinking / Pro Toggle */}
                    <button 
                        onClick={() => setUseThinking(!useThinking)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                            useThinking 
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                            : 'bg-[#2d2d2d] text-gray-400 hover:text-gray-200 border border-[#3f3f46] hover:bg-[#3f3f46]'
                        }`}
                    >
                        <Brain size={14} />
                        <span>Think</span>
                    </button>

                    <div className="w-px h-4 bg-[#3f3f46] mx-1" />

                    {/* Attachment */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#3f3f46] rounded-md transition-colors"
                    >
                        <Paperclip size={18} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange}
                        multiple
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Send Button */}
                    <button 
                        onClick={handleSend}
                        disabled={isLoading || (!text.trim() && attachments.length === 0)}
                        className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
                            (text.trim() || attachments.length > 0) && !isLoading 
                            ? 'bg-[#2dd4bf] text-black hover:bg-[#14b8a6] shadow-[0_0_15px_rgba(45,212,191,0.3)]' 
                            : 'bg-[#2d2d2d] text-gray-600 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? (
                             <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <ArrowRight size={18} />
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InputArea;