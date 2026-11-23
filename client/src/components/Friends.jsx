import { useEffect, useState } from "react";
import { Search, UserPlus, Check, X, Users, MessageSquare, UserMinus, User } from "lucide-react";
import api from "../services/api";

function Friends({ onStartChat, onFriendsUpdated, onlineUsers = [], socket }) {
    const [searchUsername, setSearchUsername] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [requests, setRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [statusMessage, setStatusMessage] = useState("");
    const [removingId, setRemovingId] = useState(null);

    const loadData = async () => {
        try {
            const [requestRes, friendRes] = await Promise.all([
                api.get("/friends/requests"),
                api.get("/friends/list")
            ]);

            setRequests(requestRes.data.requests || []);
            setFriends(friendRes.data.friends || []);
            if (onFriendsUpdated) onFriendsUpdated();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadData();

        if (!socket) return;

        const handleFriendRequestReceived = (newRequest) => {
            setRequests((prev) => {
                if (prev.some((r) => r.id === newRequest.id)) return prev;
                return [newRequest, ...prev];
            });
            setStatusMessage(`New friend request from ${newRequest.sender?.name || "someone"}!`);
        };

        const handleFriendRequestAccepted = () => {
            loadData();
        };

        const handleFriendRemoved = () => {
            loadData();
        };

        socket.on("friend-request-received", handleFriendRequestReceived);
        socket.on("friend-request-accepted", handleFriendRequestAccepted);
        socket.on("friend-removed", handleFriendRemoved);

        return () => {
            socket.off("friend-request-received", handleFriendRequestReceived);
            socket.off("friend-request-accepted", handleFriendRequestAccepted);
            socket.off("friend-removed", handleFriendRemoved);
        };
    }, [socket]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchUsername.trim()) return;

        setSearching(true);
        try {
            const response = await api.get(
                `/friends/search?username=${encodeURIComponent(searchUsername.trim())}`
            );
            setSearchResults(response.data.users || []);
            if (response.data.users?.length === 0) {
                setStatusMessage(`No users found matching "${searchUsername.trim()}"`);
            } else {
                setStatusMessage("");
            }
        } catch (error) {
            console.error(error);
            setStatusMessage("Search failed");
        } finally {
            setSearching(false);
        }
    };

    const sendRequest = async (receiverId) => {
        try {
            await api.post("/friends/request", { receiverId });
            setStatusMessage("Friend request sent!");
            setSearchResults(searchResults.filter((user) => user.id !== receiverId));
            if (onFriendsUpdated) onFriendsUpdated();
        } catch (error) {
            setStatusMessage(error.response?.data?.message || "Request failed");
        }
    };

    const respondToRequest = async (id, status) => {
        try {
            await api.patch(`/friends/request/${id}`, { status });
            await loadData();
        } catch (error) {
            console.error(error);
            setStatusMessage("Could not update friend request");
        }
    };

    const handleRemoveFriend = async (friendId, friendName) => {
        if (!window.confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
            return;
        }

        setRemovingId(friendId);
        try {
            await api.delete(`/friends/${friendId}`);
            setFriends(friends.filter((f) => f.id !== friendId));
            setStatusMessage(`Removed ${friendName} from friends.`);
            if (onFriendsUpdated) onFriendsUpdated();
        } catch (error) {
            console.error(error);
            setStatusMessage("Failed to remove friend.");
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="friends-view-container">
            {/* Header */}
            <div className="friends-header">
                <div className="friends-header-left">
                    <Users size={22} className="header-icon" />
                    <h2>Friends</h2>
                </div>

                {/* Inline Add Friend Bar */}
                <form className="friend-search-form compact" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Add friend by username..."
                        value={searchUsername}
                        onChange={(e) => setSearchUsername(e.target.value)}
                    />
                    <button type="submit" disabled={!searchUsername.trim() || searching}>
                        <UserPlus size={16} />
                        <span>Add</span>
                    </button>
                </form>
            </div>

            {/* Status Feedback Banner */}
            {statusMessage && (
                <div className="friends-status-banner">
                    <span>{statusMessage}</span>
                    <button className="banner-dismiss-btn" onClick={() => setStatusMessage("")}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Search Results Dropdown/Card */}
            {searchResults.length > 0 && (
                <div className="friends-section">
                    <div className="section-title-row">
                        <h3>Search Results</h3>
                        <button className="clear-results-btn" onClick={() => { setSearchResults([]); setSearchUsername(""); }}>
                            Clear
                        </button>
                    </div>
                    <div className="cards-grid">
                        {searchResults.map((user) => (
                            <div className="user-card" key={user.id}>
                                <div className="user-card-info">
                                    <div className="card-avatar">
                                        {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                                    </div>
                                    <div>
                                        <strong>{user.name}</strong>
                                        <p>@{user.username}</p>
                                    </div>
                                </div>
                                <button className="add-action-btn" onClick={() => sendRequest(user.id)}>
                                    <UserPlus size={16} /> Send Request
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Requests Section */}
            {requests.length > 0 && (
                <div className="friends-section">
                    <div className="section-title-row">
                        <h3>Pending Requests — {requests.length}</h3>
                    </div>
                    <div className="cards-grid">
                        {requests.map((request) => (
                            <div className="user-card" key={request.id}>
                                <div className="user-card-info">
                                    <div className="card-avatar">
                                        {request.sender?.name ? request.sender.name.charAt(0).toUpperCase() : <User size={16} />}
                                    </div>
                                    <div>
                                        <strong>{request.sender?.name}</strong>
                                        <p>@{request.sender?.username}</p>
                                    </div>
                                </div>
                                <div className="action-buttons">
                                    <button
                                        className="accept-btn"
                                        onClick={() => respondToRequest(request.id, "ACCEPTED")}
                                        title="Accept Request"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        className="reject-btn"
                                        onClick={() => respondToRequest(request.id, "REJECTED")}
                                        title="Decline Request"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Friends List */}
            <div className="friends-section">
                <div className="section-title-row">
                    <h3>All Friends — {friends.length}</h3>
                </div>

                {friends.length === 0 ? (
                    <div className="empty-friends-state">
                        <Users size={36} />
                        <p>No friends yet. Use the search bar above to add your first friend!</p>
                    </div>
                ) : (
                    <div className="cards-grid">
                        {friends.map((friend) => {
                            const isOnline = onlineUsers.includes(friend.id);
                            return (
                                <div className="user-card friend-card" key={friend.id}>
                                    <div className="user-card-info">
                                        <div className="card-avatar-wrapper">
                                            <div className="card-avatar">
                                                {friend.name ? friend.name.charAt(0).toUpperCase() : <User size={16} />}
                                            </div>
                                            <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
                                        </div>
                                        <div>
                                            <strong>{friend.name}</strong>
                                            <p>@{friend.username}</p>
                                        </div>
                                    </div>

                                    <div className="friend-card-actions">
                                        <button
                                            className="message-action-btn"
                                            onClick={() => onStartChat && onStartChat(friend)}
                                            title="Message"
                                        >
                                            <MessageSquare size={16} />
                                            <span>Message</span>
                                        </button>
                                        <button
                                            className="remove-action-btn"
                                            onClick={() => handleRemoveFriend(friend.id, friend.name)}
                                            disabled={removingId === friend.id}
                                            title="Remove Friend"
                                        >
                                            <UserMinus size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Friends;
