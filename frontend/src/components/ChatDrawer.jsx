import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Send, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ChatWindow({ otherUser, itemContext, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!otherUser) return;
    try {
      const res = await axios.get(`${API}/chat/${otherUser.user_id}`, { withCredentials: true });
      setMessages(res.data);
    } catch {}
  }, [otherUser]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await axios.post(`${API}/chat`, {
        recipient_id: otherUser.user_id,
        text: text.trim(),
        item_id: itemContext?.item_id || "",
      }, { withCredentials: true });
      setText("");
      fetchMessages();
    } catch {}
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-100">
        <button onClick={onBack} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
        <img src={otherUser?.picture || "https://via.placeholder.com/32"} alt="" className="w-8 h-8 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{otherUser?.name}</p>
          {itemContext && <p className="text-[10px] text-gray-400 truncate">Re: {itemContext.name}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-8">Inizia la conversazione!</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.user_id;
          return (
            <div key={msg.message_id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                isMine ? "bg-gray-900 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"
              }`}>
                <p>{msg.text}</p>
                <p className={`text-[9px] mt-1 ${isMine ? "text-gray-400" : "text-gray-400"}`}>
                  {new Date(msg.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Scrivi un messaggio..." className="rounded-full text-sm"
            data-testid="chat-input" />
          <Button onClick={sendMessage} disabled={!text.trim() || sending}
            className="rounded-full bg-gray-900 text-white px-3" size="sm"
            data-testid="chat-send-btn"
          ><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function ChatList({ onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(`${API}/chats`, { withCredentials: true });
        setChats(res.data);
      } catch {}
      setLoading(false);
    };
    fetchChats();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900">Messaggi</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-center text-xs text-gray-400 py-8">Caricamento...</p>
        ) : chats.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Nessun messaggio</p>
          </div>
        ) : (
          chats.map((chat) => (
            <button key={chat.chat_key} onClick={() => onSelectChat(chat.other_user, chat.item_id)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
              data-testid={`chat-item-${chat.chat_key}`}
            >
              <img src={chat.other_user?.picture || "https://via.placeholder.com/36"} alt=""
                className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{chat.other_user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{chat.last_message}</p>
              </div>
              <span className="text-[10px] text-gray-300 flex-shrink-0">
                {new Date(chat.last_time).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function ChatDrawer({ open, onOpenChange, initialUser, initialItem }) {
  const [activeChat, setActiveChat] = useState(null);
  const [itemContext, setItemContext] = useState(null);

  useEffect(() => {
    if (initialUser) {
      setActiveChat(initialUser);
      setItemContext(initialItem || null);
    }
  }, [initialUser, initialItem]);

  const handleBack = () => { setActiveChat(null); setItemContext(null); };
  const handleClose = () => { setActiveChat(null); setItemContext(null); onOpenChange(false); };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-[360px] sm:w-[400px] p-0 flex flex-col" data-testid="chat-drawer">
        <SheetHeader className="sr-only">
          <SheetTitle>Chat</SheetTitle>
          <SheetDescription>Messaggi con altri collezionisti</SheetDescription>
        </SheetHeader>
        {activeChat ? (
          <ChatWindow otherUser={activeChat} itemContext={itemContext} onBack={handleBack} />
        ) : (
          <ChatList onSelectChat={(u, itemId) => { setActiveChat(u); setItemContext(itemId ? { item_id: itemId } : null); }} />
        )}
      </SheetContent>
    </Sheet>
  );
}
