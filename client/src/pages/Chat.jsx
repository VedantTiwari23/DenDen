
import { useEffect, useState } from "react";
import { Send, MessageCircle, User } from "lucide-react";
import api from "../services/api";
import socket from "../services/socket";

function Chat() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const loadFriends = async () => {
            try {
                const response = await api.get("/friends/list");
                setFriends(response.data.friends);
            } catch (error) {
                setError("Failed to load friends");
            }
        };

        loadFriends();
    }, []);

    useEffect(() => {
        if (!selectedFriend) return;

        const loadMessages = async () => {
            try {
                const response = await api.get(
                    `/messages/${selectedFriend.id}`
                );
                setMessages(response.data.messages);
                setError("");
            } catch (error) {
                setError("Failed to load messages");
            }
        };

        setMessages([]);
        loadMessages();
    }, [selectedFriend]);

    useEffect(() => {
        const handleNewMessage = (message) => {
            if (
                selectedFriend &&
                (
                    (message.senderId === user.id &&
                        message.receiverId === selectedFriend.id) ||
                    (message.senderId === selectedFriend.id &&
                        message.receiverId === user.id)
                )
            ) {
                setMessages((previous) => {
                    if (previous.some((item) => item.id === message.id)) {
                        return previous;
                    }

                    return [...previous, message];
                });
            }
        };

        const handleMessageError = (message) => {
            setError(message);
        };

        socket.on("new-message", handleNewMessage);
        socket.on("message-error", handleMessageError);

        return () => {
            socket.off("new-message", handleNewMessage);
            socket.off("message-error", handleMessageError);
        };
    }, [selectedFriend, user.id]);

    const sendMessage = (e) => {
        e.preventDefault();

        if (!content.trim() || !selectedFriend) return;

        if (!socket.connected) {
            setError("Connection unavailable. Please refresh the page.");
            return;
        }

        socket.emit("send-message", {
            receiverId: selectedFriend.id,
            content: content.trim()
        });

        setContent("");
        setError("");
    };

    return (
        <div className="chat-page">
            <div className="chat-friends">
                <h2>Messages</h2>

                {friends.map((friend) => (
                    <button
                        key={friend.id}
                        className={
                            selectedFriend?.id === friend.id
                                ? "chat-friend active"
                                : "chat-friend"
                        }
                        onClick={() => setSelectedFriend(friend)}
                    >
                        <User size={20} />
                        <span>
                            <strong>{friend.name}</strong>
                            <small>@{friend.username}</small>
                        </span>
                    </button>
                ))}
            </div>

            <div className="chat-conversation">
                {selectedFriend ? (
                    <>
                        <div className="chat-topbar">
                            <User size={22} />
                            <div>
                                <strong>{selectedFriend.name}</strong>
                                <small>@{selectedFriend.username}</small>
                            </div>
                        </div>

                        <div className="chat-messages">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={
                                        message.senderId === user.id
                                            ? "message-bubble sent"
                                            : "message-bubble received"
                                    }
                                >
                                    {message.content}
                                </div>
                            ))}

                            {messages.length === 0 && (
                                <p className="chat-empty">
                                    Say hello and start your conversation!
                                </p>
                            )}
                        </div>

                        {error && <p className="chat-error">{error}</p>}

                        <form className="chat-input-area" onSubmit={sendMessage}>
                            <input
                                type="text"
                                placeholder="Type your message..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <button type="submit">
                                <Send size={19} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="chat-placeholder">
                        <MessageCircle size={45} />
                        <h2>Select a friend</h2>
                        <p>Choose a friend to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Chat;
