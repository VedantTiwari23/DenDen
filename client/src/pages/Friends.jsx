
import { useEffect, useState } from "react";
import { Search, UserPlus, Check, X, Users } from "lucide-react";
import api from "../services/api";

function Friends() {
    const [username, setUsername] = useState("");
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [message, setMessage] = useState("");

    const loadData = async () => {
        try {
            const [requestRes, friendRes] = await Promise.all([
                api.get("/friends/requests"),
                api.get("/friends/list")
            ]);

            setRequests(requestRes.data.requests);
            setFriends(friendRes.data.friends);
        } catch (error) {
            setMessage("Failed to load friends data");
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const searchUsers = async () => {
        try {
            const response = await api.get(
                `/friends/search?username=${encodeURIComponent(username)}`
            );

            setUsers(response.data.users);
            setMessage("");
        } catch (error) {
            setMessage("Search failed");
        }
    };

    const sendRequest = async (receiverId) => {
        try {
            await api.post("/friends/request", { receiverId });
            setMessage("Friend request sent!");
            setUsers(users.filter(user => user.id !== receiverId));
        } catch (error) {
            setMessage(error.response?.data?.message || "Request failed");
        }
    };

    const respondToRequest = async (id, status) => {
        try {
            await api.patch(`/friends/request/${id}`, { status });
            await loadData();
        } catch (error) {
            setMessage("Could not update friend request");
        }
    };

    return (
        <div className="friends-page">
            <h2>Find Friends</h2>

            <div className="friend-search">
                <input
                    type="text"
                    placeholder="Search by username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <button onClick={searchUsers}>
                    <Search size={18} /> Search
                </button>
            </div>

            {message && <p>{message}</p>}

            <h3>Search Results</h3>
            {users.map(user => (
                <div className="friend-item" key={user.id}>
                    <div>
                        <strong>{user.name}</strong>
                        <p>@{user.username}</p>
                    </div>
                    <button onClick={() => sendRequest(user.id)}>
                        <UserPlus size={17} /> Add
                    </button>
                </div>
            ))}

            <h3>Friend Requests</h3>
            {requests.map(request => (
                <div className="friend-item" key={request.id}>
                    <div>
                        <strong>{request.sender.name}</strong>
                        <p>@{request.sender.username}</p>
                    </div>
                    <div>
                        <button onClick={() => respondToRequest(request.id, "ACCEPTED")}>
                            <Check size={17} />
                        </button>
                        <button onClick={() => respondToRequest(request.id, "REJECTED")}>
                            <X size={17} />
                        </button>
                    </div>
                </div>
            ))}

            <h3><Users size={19} /> My Friends</h3>
            {friends.map(friend => (
                <div className="friend-item" key={friend.id}>
                    <div>
                        <strong>{friend.name}</strong>
                        <p>@{friend.username}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Friends;
