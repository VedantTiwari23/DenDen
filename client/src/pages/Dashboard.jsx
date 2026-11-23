import { useState, useEffect } from "react";
import {
    MessageCircle,
    Users,
    LogOut,
    User,
    UserPlus
} from "lucide-react";

import Friends from "../components/Friends";
import Chat from "../components/Chat";
import socket from "../services/socket";
import api from "../services/api";

function Dashboard() {
    const [activeView, setActiveView] = useState("chat"); // "chat" or "friends"
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const loadFriendsData = async () => {
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                api.get("/friends/list"),
                api.get("/friends/requests")
            ]);
            setFriends(friendsRes.data.friends || []);
            setPendingRequestsCount(requestsRes.data.requests?.length || 0);
        } catch (error) {
            console.error("Failed to load friends data", error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        socket.auth = { token };
        socket.connect();

        const handleOnlineUsers = (users) => {
            setOnlineUsers(users);
        };

        const handleFriendRequestReceived = () => {
            loadFriendsData();
        };

        const handleFriendRequestAccepted = () => {
            loadFriendsData();
        };

        const handleFriendRemoved = ({ friendId }) => {
            loadFriendsData();
            setSelectedFriend((prev) => (prev?.id === friendId ? null : prev));
        };

        socket.on("online-users", handleOnlineUsers);
        socket.on("friend-request-received", handleFriendRequestReceived);
        socket.on("friend-request-accepted", handleFriendRequestAccepted);
        socket.on("friend-removed", handleFriendRemoved);

        loadFriendsData();

        return () => {
            socket.off("online-users", handleOnlineUsers);
            socket.off("friend-request-received", handleFriendRequestReceived);
            socket.off("friend-request-accepted", handleFriendRequestAccepted);
            socket.off("friend-removed", handleFriendRemoved);
            socket.disconnect();
        };
    }, []);

    const handleSelectFriend = (friend) => {
        setSelectedFriend(friend);
        setActiveView("chat");
    };

    const handleOpenFriends = () => {
        setActiveView("friends");
    };

    const handleLogout = () => {
        socket.disconnect();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    return (
        <div className="dashboard dark-theme">
            {/* Left Sidebar: DM Area */}
            <aside className="sidebar">
                <div className="sidebar-top">
                    <div className="dashboard-brand">
                        <div className="brand-icon">
                            <MessageCircle size={22} />
                        </div>
                        <h2>Denden</h2>
                    </div>

                    {/* Friends Button at Top */}
                    <button
                        className={`friends-tab-btn ${activeView === "friends" ? "active" : ""}`}
                        onClick={handleOpenFriends}
                    >
                        <div className="btn-left">
                            <Users size={19} />
                            <span>Friends</span>
                        </div>
                        {pendingRequestsCount > 0 && (
                            <span className="badge">{pendingRequestsCount}</span>
                        )}
                    </button>
                </div>

                {/* Direct Messages List */}
                <div className="dm-section">
                    <div className="dm-section-header">
                        <span>DIRECT MESSAGES</span>
                        <span className="dm-count">{friends.length}</span>
                    </div>

                    <div className="dm-list">
                        {friends.map((friend) => {
                            const isOnline = onlineUsers.includes(friend.id);
                            const isSelected = selectedFriend?.id === friend.id && activeView === "chat";

                            return (
                                <button
                                    key={friend.id}
                                    className={`dm-item ${isSelected ? "active" : ""}`}
                                    onClick={() => handleSelectFriend(friend)}
                                >
                                    <div className="dm-avatar-wrapper">
                                        <div className="dm-avatar">
                                            {friend.name ? friend.name.charAt(0).toUpperCase() : <User size={16} />}
                                        </div>
                                        <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
                                    </div>

                                    <div className="dm-info">
                                        <div className="dm-name-row">
                                            <strong className="dm-name">{friend.name}</strong>
                                        </div>
                                        <span className="dm-username">@{friend.username}</span>
                                    </div>
                                </button>
                            );
                        })}

                        {friends.length === 0 && (
                            <div className="dm-empty">
                                <p>No friends yet.</p>
                                <button className="add-friends-hint-btn" onClick={handleOpenFriends}>
                                    <UserPlus size={15} /> Find Friends
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile & Logout at Bottom */}
                <div className="sidebar-bottom">
                    <div className="profile-mini">
                        <div className="avatar">
                            {user.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
                        </div>
                        <div className="profile-details">
                            <h4>{user.name || "Denden User"}</h4>
                            <p>@{user.username || "username"}</p>
                        </div>
                    </div>

                    <button className="logout-button" onClick={handleLogout} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main">
                {activeView === "friends" ? (
                    <Friends
                        onStartChat={(friend) => handleSelectFriend(friend)}
                        onFriendsUpdated={loadFriendsData}
                        onlineUsers={onlineUsers}
                        socket={socket}
                    />
                ) : selectedFriend ? (
                    <Chat
                        friend={selectedFriend}
                        onlineUsers={onlineUsers}
                        user={user}
                        socket={socket}
                    />
                ) : (
                    <div className="no-chat-selected">
                        <div className="placeholder-icon-wrap">
                            <MessageCircle size={48} />
                        </div>
                        <h2>Your Messages</h2>
                        <p>Select a friend from the left sidebar to start chatting, or find new friends to connect with.</p>
                        <button className="primary-button" onClick={handleOpenFriends}>
                            <Users size={18} /> View Friends
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Dashboard;
