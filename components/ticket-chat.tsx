"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, Send, Smile, Link as LinkIcon, Bold, Italic, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendTicketMessageAction } from "@/app/actions/ticket-messages";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Message {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: string;
}

export function TicketChat({ ticketId, initialMessages }: { ticketId: string, initialMessages: any[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [inputValue, setInputValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && selectedFiles.length === 0) || isLoading) return;

    setIsLoading(true);
    const textToSend = inputValue;
    const filesToSend = [...selectedFiles];
    
    setInputValue("");
    setSelectedFiles([]);

    try {
      const formData = new FormData();
      formData.append("ticketId", ticketId);
      formData.append("message", textToSend);
      filesToSend.forEach(file => formData.append("files", file));

      const result = await sendTicketMessageAction(formData);
      
      if (result.error) {
        setInputValue(textToSend);
        setSelectedFiles(filesToSend);
      } else {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: textToSend || (filesToSend.length > 0 ? "Enviado un archivo" : ""),
          sender: "user",
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex-1 relative min-h-0 overflow-y-auto">
        <ScrollArea className="absolute inset-0 px-6 py-4" ref={scrollRef}>
          <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-10">
            {/* Day Separator */}
            <div className="flex justify-center my-4">
               <span className="bg-muted/50 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full text-muted-foreground/80 border border-muted-foreground/10">Hoy</span>
            </div>

            {messages.map((message) => {
              const isUser = message.sender === "user";
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-2 group",
                    isUser ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                      "flex items-start gap-3 max-w-[85%]",
                      isUser ? "flex-row-reverse" : "flex-row"
                  )}>
                      <Avatar className={cn(
                          "h-8 w-8 shrink-0 mt-1 border border-border shadow-sm",
                          !isUser && "bg-secondary"
                      )}>
                          <AvatarImage src={!isUser ? "/solfy-agent.png" : undefined} />
                          <AvatarFallback className={isUser ? "bg-primary text-primary-foreground font-black text-[10px]" : "bg-muted text-muted-foreground font-black text-[10px]"}>
                              {isUser ? "YO" : "SL"}
                          </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col space-y-1">
                          {/* Name & Time row */}
                          <div className={cn(
                              "flex items-center gap-2 px-1",
                              isUser ? "flex-row-reverse" : "flex-row"
                          )}>
                              <span className="text-[11px] font-black tracking-tight text-foreground/80">
                                  {isUser ? "Tú" : "Equipo Solfy"}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground/60">
                                  {(() => {
                                    try {
                                      const date = new Date(message.timestamp);
                                      return isNaN(date.getTime()) 
                                        ? "Reciente" 
                                        : format(date, "HH:mm", { locale: es });
                                    } catch (e) {
                                      return "Reciente";
                                    }
                                  })()}
                              </span>
                          </div>

                          {/* Message Bubble - Pill Style */}
                          <div
                              className={cn(
                              "rounded-[20px] px-5 py-3 text-sm shadow-sm transition-all relative border",
                              isUser
                                  ? "bg-muted border-border text-foreground rounded-tr-[4px]"
                                  : "bg-secondary border-transparent text-secondary-foreground rounded-tl-[4px]"
                              )}
                          >
                              <p className="whitespace-pre-wrap leading-relaxed font-medium">{message.text}</p>
                          </div>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Modern Editor Container */}
      <div className="px-6 pb-6 pt-2 bg-background relative z-10 border-t">
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full border border-border">
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-bold truncate max-w-[150px]">{file.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                  <span className="text-[12px] leading-none">&times;</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <form 
            onSubmit={handleSendMessage} 
            className="flex flex-col rounded-2xl border border-border bg-card focus-within:ring-1 focus-within:ring-ring transition-all shadow-sm overflow-hidden"
        >
          {/* Textarea Area */}
          <div className="relative flex items-end p-4 min-h-[100px]">
            <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    // Just allow the default behavior (newline)
                    // We explicitly don't call e.preventDefault() here if we want newlines
                  }
                }}
                placeholder="Escribe tu respuesta aquí..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-sm font-medium leading-relaxed min-h-[60px] text-foreground placeholder:text-muted-foreground/50"
            />
            
            <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Paperclip className="h-4 w-4" />
                </Button>
                <Button 
                    type="submit" 
                    size="icon" 
                    className={cn(
                        "h-10 w-10 rounded-full shadow-lg transition-transform active:scale-95",
                        isLoading ? "opacity-50" : ""
                    )}
                    disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading}
                >
                    <Send className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
