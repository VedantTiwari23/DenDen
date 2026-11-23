import { useEffect, useState, useRef } from "react";
import { Send, User, ArrowLeft } from "lucide-react";
import api from "../services/api";

function Chat({ friend, onlineUsers, user, socket, onBack }) {
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const isOnline = onlineUsers.includes(friend?.id);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!friend?.id) return;

        const loadMessages = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/messages/${friend.id}`);
                setMessages(response.data.messages || []);
                setError("");
            } catch (err) {
                console.error(err);
                setError("Failed to load messages");
            } finally {
                setLoading(false);
            }
        };

        setMessages([]);
        loadMessages();
    }, [friend?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleNewMessage = (message) => {
            if (
                friend &&
                (
                    (message.senderId === user.id && message.receiverId === friend.id) ||
                    (message.senderId === friend.id && message.receiverId === user.id)
                )
            ) {
                setMessages((prev) => {
                    if (prev.some((item) => item.id === message.id)) {
                        return prev;
                    }
                    return [...prev, message];
                });
            }
        };

        const handleMessageError = (msg) => {
            setError(msg);
        };

        socket.on("new-message", handleNewMessage);
        socket.on("message-error", handleMessageError);

        return () => {
            socket.off("new-message", handleNewMessage);
            socket.off("message-error", handleMessageError);
        };
    }, [friend, user.id, socket]);

    const sendMessage = (e) => {
        e.preventDefault();

        if (!content.trim() || !friend) return;

        if (!socket.connected) {
            setError("Connection unavailable. Please refresh.");
            return;
        }

        socket.emit("send-message", {
            receiverId: friend.id,
            content: content.trim()
        });

        setContent("");
        setError("");
    };

    return (
        <div className="conversation-container">
            {/* Conversation Topbar */}
            <div className="chat-topbar">
                <div className="chat-topbar-left">
                    {onBack && (
                        <button className="mobile-back-btn" onClick={onBack} title="Back to conversations">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="chat-topbar-user">
                        <div className="avatar-wrapper">
                            <div className="avatar">
                                {friend.name ? friend.name.charAt(0).toUpperCase() : <User size={18} />}
                            </div>
                            <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
                        </div>

                        <div className="user-details">
                            <strong className="name">{friend.name}</strong>
                            <span className="status-text">
                                {isOnline ? "Online" : "Offline"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Feed */}
            <div className="chat-messages">
                {loading ? (
                    <div className="chat-empty">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="chat-empty">
                        <p className="start-prompt">
                            This is the beginning of your direct message history with <strong>{friend.name}</strong>.
                        </p>
                        <p className="sub-prompt">Say hello to get the conversation started!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isSent = message.senderId === user.id;
                        return (
                            <div
                                key={message.id}
                                className={`message-bubble-wrapper ${isSent ? "sent" : "received"}`}
                            >
                                <div className={`message-bubble ${isSent ? "sent" : "received"}`}>
                                    {message.content}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {error && <div className="chat-error-bar">{error}</div>}

            {/* Input Form */}
            <form className="chat-input-area" onSubmit={sendMessage}>
                <input
                    type="text"
                    placeholder={`Message @${friend.username}...`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    autoFocus
                />
                <button type="submit" disabled={!content.trim()} title="Send Message">
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}

export default Chat;
