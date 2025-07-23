import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";

interface Message {
  id: number;
  from: string;
  to: string;
  content: string;
  file?: [];
  timestamp: string;
  read: boolean;
}

interface User {
  username: string;
  email: string;
  role: string;
  status: number;
}

interface InboxTabProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  loading: boolean;
  currentUser: User;
  users: User[];
}

const InboxTab: React.FC<InboxTabProps> = ({ messages, setMessages, loading, currentUser, users }) => {
  const [newMessage, setNewMessage] = useState<{ to: string; content: string }>({
    to: '',
    content: ''
  });

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.to || !newMessage.content) {
      alert('Please select a recipient and enter a message');
      return;
    }
    const newMsg: Message = {
      id: messages.length + 1,
      from: currentUser.username,
      to: newMessage.to,
      content: newMessage.content,
      timestamp: new Date().toLocaleString(),
      read: false
    };
    setMessages([newMsg, ...messages]);
    setNewMessage({ to: '', content: '' });
    alert('Message sent successfully!');
  };

  return (
    <div className="flex flex-row gap-2">
      <Card className="w-1/3">
        <CardHeader>
          <CardTitle className='text-lg md:text-xl'>Messages</CardTitle>
          <CardDescription>Your conversations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div>
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className={`p-2 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${!message.read ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                  onClick={() => {
                    if (!message.read) {
                      setMessages(messages.map(m => 
                        m.id === message.id ? {...m, read: true} : m
                      ));
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm">{message.from}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex overflow-auto">
                        {message.content}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{message.timestamp.split(' ')[1]}</span>
                  </div>
                  {!message.read && (
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-2"></span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-2/3">
        <CardHeader>
          <CardTitle className='text-lg sm:text-xl'>Compose Message</CardTitle>
          <CardDescription>Send a message to another user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <select 
                className="w-full p-2 border rounded-md text-sm"
                value={newMessage.to}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewMessage({...newMessage, to: e.target.value})}
              >
                <option value="">Select a user</option>
                {users
                  .filter(user => user.username !== currentUser.username)
                  .map(user => (
                    <option key={user.username} value={user.username}>
                      {user.username} ({user.role})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea 
                className="w-full p-2 border rounded-md min-h-[100px] text-sm"
                value={newMessage.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage({...newMessage, content: e.target.value})}
                placeholder="Type your message here..."
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-primary hover:bg-primary-dark w-full sm:w-auto">
                Send Message
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InboxTab;
