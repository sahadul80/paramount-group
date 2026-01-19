import { User, Message, Group } from '@/types/users';

export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const username = localStorage.getItem("user");
    const response = await fetch('/api/user/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return await response.json();
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await fetch('/api/user/all', {
      method: 'GET',
    });
    return await response.json();
  },

  updateUser: async (username: string, updateData: Partial<User>): Promise<User> => {
    const response = await fetch('/api/user/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, ...updateData }),
    });
    return await response.json();
  },

  updateUserStatus: async (username: string, status: number): Promise<User> => {
    const response = await fetch('/api/user/update-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, status }),
    });
    return await response.json();
  },

  deleteUser: async (username: string): Promise<void> => {
    await fetch('/api/user/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
  }
};

export const messageApi = {
  getMessages: async (): Promise<Message[]> => {
    const response = await fetch('/api/user/messages');
    return await response.json();
  },

  sendMessage: async (to: string, content: string): Promise<Message> => {
    const response = await fetch('/api/user/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, content }),
    });
    return await response.json();
  },

  markAsRead: async (messageId: string): Promise<void> => {
    await fetch('/api/user/messages/read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    });
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await fetch('/api/user/messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    });
  }
};

export const groupApi = {
  getGroups: async (): Promise<Group[]> => {
    const response = await fetch('/api/user/groups');
    return await response.json();
  },

  createGroup: async (groupData: Partial<Group>): Promise<Group> => {
    const response = await fetch('/api/user/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData),
    });
    return await response.json();
  },

  updateGroup: async (groupId: string, updateData: Partial<Group>): Promise<Group> => {
    const response = await fetch('/api/user/groups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, ...updateData }),
    });
    return await response.json();
  },

  deleteGroup: async (groupId: string): Promise<void> => {
    await fetch('/api/user/groups', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    });
  }
};

export const sseApi = {
  connect: (callbacks: {
    onOpen: () => void;
    onMessage: (event: any) => void;
    onError: () => number; // Changed: should return number (reconnect delay)
  }) => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource('/api/user/stream');

      eventSource.onopen = () => {
        callbacks.onOpen();
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          callbacks.onMessage(parsed);
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        const delay = callbacks.onError();
        reconnectTimeout = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }
};