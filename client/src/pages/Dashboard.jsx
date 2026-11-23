
import { useState, useEffect } from "react";
import {
    MessageCircle,
    Users,
    Video,
    Settings,
    LogOut,
    Plus,
    Phone,
    User,
    Circle
} from "lucide-react";

import Friends from "./Friends";
import Chat from "./Chat";
import socket from "../services/socket";

function Dashboard() {
    const [activeTab, setActiveTab] = useState("Chats");
    const [onlineUsers, setOnlineUsers] = useState([]);

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) return;

        socket.auth = { token };
        socket.connect();

        socket.on("online-users", (users) => {
            setOnlineUsers(users);
        });

        return () => {
            socket.off("online-users");
            socket.disconnect();
        };
    }, []);

    const menuItems = [
        { name: "Chats", icon: MessageCircle },
        { name: "Friends", icon: Users },
        { name: "Calls", icon: Video },
        { name: "Settings", icon: Settings }
    ];

    const handleLogout = () => {
        socket.disconnect();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <div className="dashboard-brand">
                    <MessageCircle size={30} />
                    <h2>Denden</h2>
                </div>

                <div className="sidebar-menu">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.name}
                                className={activeTab === item.name ? "menu-item active" : "menu-item"}
                                onClick={() => setActiveTab(item.name)}
                            >
                                <Icon size={21} />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="sidebar-bottom">
                    <div className="profile-mini">
                        <div className="avatar">
                            <User size={20} />
                        </div>

                        <div>
                            <h4>{user.name || "Denden User"}</h4>
                            <p>@{user.username || "username"}</p>
                        </div>
                    </div>

                    <button className="logout-button" onClick={handleLogout}>
                        <LogOut size={19} />
                        Logout
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <h1>{activeTab}</h1>
                        <p>
                            <Circle
                                size={9}
                                fill="#25C991"
                                color="#25C991"
                                style={{ display: "inline", marginRight: "6px" }}
                            />
                            {onlineUsers.length} users online
                        </p>
                    </div>

                    <div className="header-actions">
                        <button className="icon-button">
                            <Video size={21} />
                        </button>
                        <button className="icon-button">
                            <Phone size={21} />
                        </button>
                    </div>
                </header>

                <div className="dashboard-content">
                    {activeTab === "Chats" && <Chat />}

                    {activeTab === "Friends" && <Friends />}

                    {activeTab === "Calls" && (
                        <div className="empty-state">
                            <Video size={42} />
                            <h2>Call History</h2>
                            <p>Video calling will be available soon.</p>
                        </div>
                    )}

                    {activeTab === "Settings" && (
                        <div className="empty-state">
                            <Settings size={42} />
                            <h2>Settings</h2>
                            <p>Profile settings will be available soon.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
