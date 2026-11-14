import { create } from 'zustand';

export const useRoomStore = create((set) => ({
  roomInfo: null,
  messages: [],
  users: [],
  isOwner: false,
  currentUserId: null,

  setRoomInfo: (info) => set({ roomInfo: info }),
  
  setIsOwner: (isOwner) => set({ isOwner }),
  
  setCurrentUserId: (id) => set({ currentUserId: id }),
  
  setUsers: (users) => set({ users }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  setMessages: (messages) => set({ messages }),
  
  // Update user name in all messages
  updateUserName: (userId, newName) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.from === userId ? { ...msg, name: newName } : msg
    )
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  clearRoom: () => set({
    roomInfo: null,
    messages: [],
    users: [],
    isOwner: false,
    currentUserId: null
  })
}));
