import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Loader2, History, Trash2 } from 'lucide-react';
import { chatService } from '@/services/chatService';
import { logger } from '@/utils/logger';
import type { ChatMessage } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const AIChat = React.memo(() => {
  const { toast } = useToast();
  const [conversationId, setConversationId] = useState<string>(crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await chatService.getHistory({ 
          conversation_id: conversationId,
          limit: 50 
        });
        
        if (history.length === 0) {
          // Add welcome message if no history
          setMessages([{
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Hello! I\'m your AI medical assistant. I can help answer questions about patient care, drug interactions, treatment protocols, and general medical inquiries. How can I assist you today?',
            created_at: new Date().toISOString(),
          }]);
        } else {
          setMessages(history);
        }
      } catch (error) {
        logger.error('Failed to load chat history', error);
        // Add welcome message on error
        setMessages([{
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Hello! I\'m your AI medical assistant. I can help answer questions about patient care, drug interactions, treatment protocols, and general medical inquiries. How can I assist you today?',
          created_at: new Date().toISOString(),
        }]);
      }
    };
    
    loadHistory();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    try {
      await chatService.streamMessage(
        { message: userMessage.content, conversation_id: conversationId },
        
        // onToken
        (token: string) => {
          assistantContent += token;
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant' && lastMsg.id === assistantId) {
              // Update existing assistant message
              return prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: assistantContent }
                  : m
              );
            } else {
              // Add new assistant message
              return [...prev, {
                id: assistantId,
                role: 'assistant',
                content: assistantContent,
                created_at: new Date().toISOString(),
              }];
            }
          });
        },
        
        // onDone
        (newConversationId: string) => {
          if (newConversationId) {
            setConversationId(newConversationId);
          }
          setIsStreaming(false);
        },
        
        // onError
        (error: string) => {
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive',
          });
          setIsStreaming(false);
        }
      );
    } catch (error: any) {
      logger.error('Failed to send message', error);
      setIsStreaming(false);
    }
  }, [input, isStreaming, conversationId, toast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleClearHistory = useCallback(async () => {
    try {
      await chatService.deleteConversation(conversationId);
      const newConversationId = crypto.randomUUID();
      setConversationId(newConversationId);
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Hello! I\'m your AI medical assistant. I can help answer questions about patient care, drug interactions, treatment protocols, and general medical inquiries. How can I assist you today?',
        created_at: new Date().toISOString(),
      }]);
      setShowDeleteDialog(false);
      setShowHistory(false);
      toast({
        title: 'Conversation cleared',
        description: 'Your chat history has been deleted.',
      });
    } catch (error) {
      logger.error('Failed to clear history', error);
      toast({
        title: 'Error',
        description: 'Failed to clear conversation',
        variant: 'destructive',
      });
    }
  }, [conversationId, toast]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-gradient-to-br from-background via-background to-primary/5 rounded-2xl border border-border/40 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">AI Medical Assistant</h1>
              <p className="text-xs text-muted-foreground">Powered by advanced medical AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  <span className="text-xs">History</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Chat History</DialogTitle>
                  <DialogDescription>
                    View your conversation history with the AI assistant
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="text-xs">Clear</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-hover text-primary-foreground text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`
                  rounded-2xl px-4 py-3 max-w-[80%] shadow-sm
                  ${message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-12'
                    : 'bg-card border border-border/50'
                  }
                `}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <p className={`text-[10px] mt-2 ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {message.role === 'user' && (
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-hover text-primary-foreground text-xs">
                    DS
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-4 justify-start">
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-hover text-primary-foreground text-xs">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl px-4 py-3 bg-card border border-border/50 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-card/80 backdrop-blur-sm border-t border-border px-6 py-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about patient care, medications, diagnostics..."
              className="resize-none min-h-[52px] max-h-32 pr-4 text-sm rounded-xl border-border/50 focus:border-primary/50"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="h-[52px] w-[52px] rounded-xl bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/70 text-center mt-3 max-w-4xl mx-auto">
          AI-powered medical assistant. Responses are generated in real-time using Grok AI.
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages in this conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">
              Clear Conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

AIChat.displayName = 'AIChat';

export default AIChat;
