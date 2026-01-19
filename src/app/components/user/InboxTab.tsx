import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Video, 
  Phone, 
  MoreVertical,
  Search,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { Message, User } from '@/types/users';
import { toast } from 'sonner';

interface InboxTabProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  loading: boolean;
  currentUser: User; // Changed: currentUser should be User, not Promise<User>
  users: User[];
  sendMessage?: (to: string, content: string) => void;
}

const InboxTab: React.FC<InboxTabProps> = ({ 
  messages, 
  setMessages, 
  loading, 
  currentUser, 
  users,
  sendMessage 
}) => {
  const [newMessage, setNewMessage] = useState<{ to: string; content: string }>({
    to: '',
    content: ''
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>({});
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter online users from all users
  const getOnlineUsers = useCallback(() => {
    return users.filter(user => 
      user.username !== currentUser.username && 
      (user.status === 5 || user.status === 2) // online or active
    );
  }, [users, currentUser]);

  // Update online users when users list changes
  useEffect(() => {
    const online = getOnlineUsers();
    setOnlineUsers(online);
    
    // Auto-select first online user if none selected
    if (!selectedUser && online.length > 0) {
      setSelectedUser(online[0]);
      setNewMessage(prev => ({ ...prev, to: online[0].username }));
    }
  }, [users, getOnlineUsers, selectedUser]);

  // When socket is connected, tell server our username
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('set_username', {
        username: currentUser.username,
        persistentId: `user-${currentUser.username}`
      });
    }
  }, [currentUser]);

  // Connect to Socket.IO server
  useEffect(() => {
    const connectSocketIO = () => {
      try {
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        setConnectionStatus('connecting');
        
        // Try to connect to Socket.IO server
        const serverUrl = 'http://192.168.6.94:4000';
        console.log('Attempting to connect to Socket.IO server at:', serverUrl);
        
        socketRef.current = io(serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000
        });
        
        socketRef.current.on('connect', () => {
          console.log('Socket.IO connected successfully');
          setIsConnected(true);
          setConnectionStatus('connected');
          reconnectAttemptsRef.current = 0;
          
          // Set username on connection
          if (socketRef.current) {
            socketRef.current.emit('set_username', {
              username: currentUser.username,
              persistentId: `user-${currentUser.username}`
            });
          }
        });
        
        socketRef.current.on('user_list', (usersList: User[]) => {
          console.log('Received user list:', usersList);
          const onlineUsersList = usersList.filter(user => 
            user.username !== currentUser.username && 
            (user.status === 5 || user.status === 2)
          );
          setOnlineUsers(onlineUsersList);
        });
        
        socketRef.current.on('chat_message', (data: Message) => {
          console.log('Received chat message:', data);
          handleIncomingMessage(data);
        });
        
        socketRef.current.on('user_typing', (data: { username: string; isTyping: boolean }) => {
          console.log('User typing:', data);
          setTypingUsers(prev => ({
            ...prev,
            [data.username]: data.isTyping
          }));
          
          // Clear typing indicator after a delay
          if (data.isTyping && typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          if (data.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setTypingUsers(prev => ({
                ...prev,
                [data.username]: false
              }));
            }, 2000);
          }
        });
        
        socketRef.current.on('disconnect', (reason) => {
          console.log('Socket.IO disconnected:', reason);
          setIsConnected(false);
          setConnectionStatus('disconnected');
          
          // Attempt to reconnect after a delay (with exponential backoff)
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(connectSocketIO, delay);
        });
        
        socketRef.current.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          setConnectionStatus('error');
          
          // Try to reconnect with a shorter delay on error
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(2000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting after error in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(connectSocketIO, delay);
        });
        
      } catch (error) {
        console.error('Failed to create Socket.IO connection:', error);
        setConnectionStatus('error');
        
        // Try to reconnect after a delay
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(3000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectTimeoutRef.current = setTimeout(connectSocketIO, delay);
      }
    };
    
    connectSocketIO();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentUser]); // Removed me from dependencies

  // Manual reconnect function
  const manualReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = 0;
    
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch (e) {
        console.error('Error disconnecting socket:', e);
      }
    }
    
    setConnectionStatus('connecting');
    
    // Try to reconnect immediately
    setTimeout(() => {
      const connectSocketIO = () => {
        try {
          const serverUrl = 'http://192.168.6.94:4000';
          socketRef.current = io(serverUrl, {
            transports: ['websocket', 'polling']
          });
          
          socketRef.current.on('connect', () => {
            console.log('Socket.IO reconnected successfully');
            setIsConnected(true);
            setConnectionStatus('connected');
            reconnectAttemptsRef.current = 0;
            
            // Set username on connection
            if (socketRef.current) {
              socketRef.current.emit('set_username', {
                username: currentUser.username,
                persistentId: `user-${currentUser.username}`
              });
            }
          });
          
          // Add other event listeners as needed
          socketRef.current.on('chat_message', handleIncomingMessage);
          socketRef.current.on('user_typing', (data: { username: string; isTyping: boolean }) => {
            setTypingUsers(prev => ({
              ...prev,
              [data.username]: data.isTyping
            }));
          });
          
        } catch (error) {
          console.error('Failed to reconnect Socket.IO:', error);
          setConnectionStatus('error');
        }
      };
      connectSocketIO();
    }, 100);
  };

  // Handle incoming messages
  const handleIncomingMessage = useCallback((data: Message) => {
    const newMsg: Message = {
      id: `${Date.now()}`,
      from: data.from,
      to: data.to || currentUser.username,
      content: data.content,
      timestamp: data.timestamp || new Date().toISOString(),
      read: data.to ? data.to === currentUser.username : false
    };
    
    setMessages(prev => [newMsg, ...prev]);
    
    // Show notification if not in inbox tab
    if (selectedUser?.username !== data.from) {
      toast.message(`New message from ${data.from}`, {
        description: data.content.length > 50 ? `${data.content.substring(0, 50)}...` : data.content
      });
    }
  }, [currentUser, setMessages, selectedUser]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (socketRef.current && socketRef.current.connected && selectedUser) {
      socketRef.current.emit('typing', {
        username: currentUser.username,
        isTyping,
        to: selectedUser.username
      });
    }
  }, [currentUser, selectedUser]);

  // Send message via HTTP API (fallback)
  const sendMessageViaAPI = async (to: string, content: string) => {
    if (!sendMessage) {
      throw new Error('Send message function not available');
    }
    
    try {
      await sendMessage(to, content);
      return true;
    } catch (error) {
      console.error('Failed to send message via API:', error);
      throw error;
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.to || !newMessage.content.trim()) {
      toast.error('Please select a recipient and enter a message');
      return;
    }
    
    // Clear typing indicator
    sendTypingIndicator(false);
    
    const messageContent = newMessage.content.trim();
    
    // Try Socket.IO first if connected
    if (isConnected && socketRef.current?.connected) {
      try {
        socketRef.current.emit('chat_message', {
          to: newMessage.to,
          text: messageContent,
          from: currentUser.username,
          timestamp: new Date().toISOString()
        });
        
        // Optimistic update
        const newMsg: Message = {
          id: `${Date.now()}`,
          from: currentUser.username,
          to: newMessage.to,
          content: messageContent,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        setMessages(prev => [newMsg, ...prev]);
        setNewMessage({ ...newMessage, content: '' });
        
      } catch (socketError) {
        console.error('Socket.IO send failed:', socketError);
        // Fall back to HTTP API
        try {
          await sendMessageViaAPI(newMessage.to, messageContent);
          setNewMessage({ ...newMessage, content: '' });
        } catch (apiError) {
          toast.error('Failed to send message. Please try again.');
        }
      }
    } else {
      // Use HTTP API as fallback
      try {
        await sendMessageViaAPI(newMessage.to, messageContent);
        setNewMessage({ ...newMessage, content: '' });
      } catch (apiError) {
        toast.error('Failed to send message. Please try again.');
      }
    }
  };

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setNewMessage(prev => ({ ...prev, to: user.username }));
    
    // Mark messages as read
    setMessages(prev => {
      return prev.map(msg => 
        msg.from === user.username && msg.to === currentUser.username && !msg.read
          ? { ...msg, read: true }
          : msg
      );
    });
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages for selected user
  const filteredMessages = selectedUser
    ? messages.filter(msg => 
        (msg.from === selectedUser.username && msg.to === currentUser.username) ||
        (msg.to === selectedUser.username && msg.from === currentUser.username)
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  // Get unread count for a user
  const getUnreadCount = (username: string) => {
    return messages.filter(msg => 
      msg.from === username && 
      msg.to === currentUser.username && 
      !msg.read
    ).length;
  };

  // Connection status indicator
  const ConnectionIndicator = () => {
    let icon, text, color;
    
    switch (connectionStatus) {
      case 'connected':
        icon = <Wifi size={14} />;
        text = 'Connected';
        color = 'text-green-500';
        break;
      case 'connecting':
        icon = <RefreshCw size={14} className="animate-spin" />;
        text = 'Connecting...';
        color = 'text-yellow-500';
        break;
      case 'error':
        icon = <WifiOff size={14} />;
        text = 'Connection Error';
        color = 'text-red-500';
        break;
      default:
        icon = <WifiOff size={14} />;
        text = 'Disconnected';
        color = 'text-gray-500';
    }
    
    return (
      <div className={`flex items-center gap-1 text-xs ${color}`}>
        {icon}
        <span>{text}</span>
        {connectionStatus === 'error' && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 ml-2"
            onClick={manualReconnect}
          >
            Retry
          </Button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] gap-4">
      {/* Contacts sidebar */}
      <Card className="w-full md:w-1/3 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="flex items-center gap-2">
              <Search size={18} className="text-muted-foreground" />
              <MoreVertical size={18} className="text-muted-foreground" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <CardDescription>
              {isConnected ? 
                `${onlineUsers.length} contacts online` : 
                'Connecting...'}
            </CardDescription>
            <ConnectionIndicator />
          </div>
        </CardHeader>
        
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {onlineUsers.map(user => {
              const unreadCount = getUnreadCount(user.username);
              
              return (
                <div
                  key={user.username}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.username === user.username 
                      ? 'bg-muted' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
                      user.status === 5 ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                  </div>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {user.firstName || user.username}
                      </p>
                      {unreadCount > 0 && (
                        <Badge className="ml-2 bg-blue-500 text-white text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">
                        {typingUsers[user.username] 
                          ? 'typing...' 
                          : (user.status === 5 ? 'Online' : user.position || 'User')
                        }
                      </p>
                      
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {onlineUsers.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>No contacts online</p>
                {connectionStatus !== 'connected' && (
                  <p className="text-sm mt-2">Check your connection</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {connectionStatus === 'error' && (
          <div className="p-3 bg-yellow-50 border-t">
            <p className="text-xs text-yellow-800 text-center">
              Connection issues detected. Messages may not be delivered in real-time.
            </p>
          </div>
        )}
      </Card>

      {/* Chat area */}
      <Card className="w-full md:w-2/3 flex flex-col">
        {selectedUser ? (
          <>
            <CardHeader className="py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.username} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {selectedUser.firstName || selectedUser.username}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {typingUsers[selectedUser.username] 
                        ? 'typing...' 
                        : (selectedUser.status === 5 ? 'Online' : 'Offline')
                      }
                      {selectedUser.position && ` • ${selectedUser.position}`}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Video size={16} />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Phone size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start a conversation with {selectedUser.firstName || selectedUser.username}</p>
                  </div>
                ) : (
                  filteredMessages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.from === currentUser.username ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md rounded-lg px-3 py-2 ${
                          message.from === currentUser.username
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.from === currentUser.username
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage.content}
                  onChange={(e) => {
                    setNewMessage({ ...newMessage, content: e.target.value });
                    if (e.target.value.trim()) {
                      sendTypingIndicator(true);
                    } else {
                      sendTypingIndicator(false);
                    }
                  }}
                  onBlur={() => sendTypingIndicator(false)}
                  className="flex-1"
                  disabled={!selectedUser}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!newMessage.content.trim() || !selectedUser}
                >
                  <Send size={18} />
                </Button>
              </form>
              {!isConnected && selectedUser && (
                <p className="text-xs text-muted-foreground mt-2">
                  Connection offline. Messages will be sent when reconnected.
                </p>
              )}
              {!selectedUser && (
                <p className="text-xs text-muted-foreground mt-2">
                  Select a contact to start chatting
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Welcome to your inbox</h3>
            <p className="text-muted-foreground mb-4">
              {onlineUsers.length > 0 
                ? "Select a contact to start chatting" 
                : "No contacts available. Connect with other users to start chatting"}
            </p>
            {onlineUsers.length === 0 && (
              <Button variant="outline" onClick={() => window.location.href = '/users'}>
                Browse Users
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default InboxTab;