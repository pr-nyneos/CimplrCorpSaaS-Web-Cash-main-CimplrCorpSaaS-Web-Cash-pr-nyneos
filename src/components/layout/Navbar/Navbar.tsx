"use client";

import "../../../styles/theme.css";
import { motion } from "framer-motion";
import loginImage from "../../../assets/logo.png";
import TacoLogo from "../../../assets/taco.png";
import {UserCog} from "lucide-react";

const CURRENCIES_TO_SHOW = ["INR", "EUR", "GBP", "JPY", "AUD"];
const mockNotifications = [
  { id: 1, title: "New message received", description: "You have a new message from the support team", time: "2 hours ago", read: false },
  { id: 2, title: "Payment processed", description: "Your payment of $1,200.00 has been processed", time: "1 day ago", read: true },
  { id: 3, title: "System update", description: "A new system update is available for your account", time: "3 days ago", read: true },
];
const navItemsList = [
  // { icon: Home, label: "Dashboard" },
  { icon: CreditCard, label: "Cash Management" },
  { icon: TrendingUp, label: "FX Hedging" },
  { icon: Shield, label: "Bank Guarantee" },
  { icon: UserCog, label: "Settings" },
];


const NavItems: React.FC<{
  items: { icon: any; label: string }[];
  active: string;
  onChange: (label: string) => void;
}> = ({ items, active, onChange }) => (
  <div className="flex items-center space-x-4 ml-8">
    {items.map((item, i) => {
      const isActive = active === item.label;
      return (
        <div
          key={i}
          onClick={() => onChange(item.label)} // 🔹 This now drives activeModule in Navbar
          className={`group flex items-center space-x-2 px-2 py-2 cursor-pointer transition-colors ${
            isActive
              ? "text-primary font-medium border-b-2 border-primary"
              : "text-primary-lt hover:text-primary"
          }`}
        >
          <item.icon
            size={18}
            className={`transition-colors ${
              isActive ? "text-primary" : "text-primary-lt group-hover:text-primary"
            }`}
          />
          <span
            className={`text-sm overflow-hidden transition-all duration-500 ease-in-out ${
              isActive ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
            } group-hover:max-w-[140px] group-hover:opacity-100 whitespace-nowrap`}
          >
            {item.label}
          </span>
        </div>
      );
    })}
  </div>
);

const NotificationsDropdown: React.FC<{
  isOpen: boolean;
  notifications: typeof mockNotifications;
}> = ({ isOpen, notifications }) =>
  isOpen ? (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute right-0 mt-2 w-72 border border-border rounded-xl shadow-xl overflow-hidden z-50"
      style={{
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(255, 255, 255, 0.96)",
      }}
    >
      <div className="bg-gradient-to-r from-primary-lt to-primary px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-body">Notifications</h3>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 border-b border-border hover:bg-gray-50 cursor-pointer ${
                !n.read ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm text-gray-900">{n.title}</h4>
                <span className="text-xs text-gray-500">{n.time}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{n.description}</p>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
        )}
      </div>

      <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-lt border-t border-border flex justify-center">
        <button className="text-xs text-body transition-colors">Mark all as read</button>
      </div>
    </motion.div>
  ) : null;

const UserDropdown: React.FC<{
  isOpen: boolean;
  user: { name: string; email: string; lastLoginTime?: string; role?: string } | null;
  onLogout: () => void;
}> = ({ isOpen, user, onLogout }) =>
  isOpen && user ? (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute right-0 mt-2 w-72 border border-border rounded-xl shadow-xl overflow-hidden z-50"
      style={{
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(255, 255, 255, 0.96)",
      }}
    >
      <div className="bg-gradient-to-r from-primary-lt to-primary px-5 py-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-body font-semibold">
              {user.name.charAt(0)}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-border rounded-full"></span>
          </div>
          <div>
            <p className="font-semibold text-body">{user.name}</p>
            <p className="text-xs text-secondary-color-lt">{user.role}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 bg-secondary-color">
        <div className="flex items-start space-x-3">
          <Mail className="w-4 h-4 text-secondary-text mt-0.5 flex-shrink-0" />
          <p className="text-sm text-secondary-text break-all">{user.email}</p>
        </div>
        <div className="flex items-start space-x-3">
          <Calendar className="w-4 h-4 text-secondary-text mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-secondary-text">Last active</p>
            <p className="text-xs font-medium text-secondary-text">
              {new Date(user.lastLoginTime || "").toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-lt border-t border-border flex justify-end">
        <button className="text-xs text-body transition-colors" onClick={onLogout}>
          Sign Out
        </button>
      </div>
    </motion.div>
  ) : null;

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Home, CreditCard, TrendingUp, Shield, Bell, User, Mail, Calendar } from "lucide-react";
import ThemeToggle from "../ThemeToggleButton";
import FXTickerPro from "./FXTickerPro";

const Navbar: React.FC = () => {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [rates, setRates] = useState<Record<string, number>>({});
  const prevRates = useRef<Record<string, number>>({});
  const [userData, setUserData] = useState<null | { name: string; email: string; lastLoginTime?: string; role?: string }>(null);
  const [isUserDetailsVisible, setIsUserDetailsVisible] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [unreadCount, setUnreadCount] = useState(mockNotifications.filter((n) => !n.read).length);
  const navigate = useNavigate();

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    const userId = localStorage.getItem("userId");
    try {
      await axios.post("https://backend-slqi.onrender.com/api/auth/logout", { userId });
      localStorage.clear();
      navigate("/", { replace: true });
    } catch (err) {
      // console.error("Logout failed:", err)
    }
  };

  const fetchUserDetails = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const res = await axios.get(`https://backend-slqi.onrender.com/api/getuserdetails/${userId}?t=${Date.now()}`);
      if (res.data.success && res.data.sessions?.length > 0) {
        const u = res.data.sessions[0];
        setUserData({ name: u.name, email: u.email, lastLoginTime: u.lastLoginTime, role: u.role });
      }
    } catch (err) {
      // console.error("Failed to fetch user details:", err)
    }
  };

  const toggleUserDetails = () => {
    if (!isUserDetailsVisible) fetchUserDetails();
    setIsUserDetailsVisible(!isUserDetailsVisible);
    setIsNotificationsVisible(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsVisible(!isNotificationsVisible);
    setIsUserDetailsVisible(false);
    if (!isNotificationsVisible) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const generateMockRates = () => {
      const mockRates: Record<string, number> = {};
      CURRENCIES_TO_SHOW.forEach((currency) => {
        mockRates[currency] = 60 + Math.random() * 80;
      });
      prevRates.current = rates;
      setRates(mockRates);
    };
    generateMockRates();
    const interval = setInterval(generateMockRates, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node) &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsVisible(false);
        setIsUserDetailsVisible(false);
      } else if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsVisible(false);
      } else if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDetailsVisible(false);
      }
    }

    if (isNotificationsVisible || isUserDetailsVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsVisible, isUserDetailsVisible]);

  return (
    <nav className="fixed top-0 right-0 h-[4rem] bg-body flex items-center pl-[6rem] shadow-sm z-30 transition-all duration-500 w-full">
      <div className="flex items-center">
        <img src={loginImage} className="w-26 h-10" alt="Login" />
        <img src={TacoLogo} className="w-30 h-12" alt="Login" />
      </div>
      <FXTickerPro />
      <div className="ml-auto mr-6">
        <NavItems items={navItemsList} active={activeNav} onChange={(label) => {
            setActiveNav(label);
            try {
              localStorage.setItem("activeModule", label);
              window.dispatchEvent(new CustomEvent("activeModuleChanged", { detail: { module: label } }));
            } catch (_) {}
          }} />
      </div>
      <div className="flex items-center space-x-4 mr-4">
        <ThemeToggle />
        <div className="relative cursor-pointer transition-colors" ref={notificationsRef}>
          <div onClick={toggleNotifications}>
            <Bell size={20} className="text-text hover:text-primary-lt" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                {unreadCount}
              </div>
            )}
          </div>
          <NotificationsDropdown isOpen={isNotificationsVisible} notifications={notifications} />
        </div>
        <div className="relative" ref={userDropdownRef}>
          <div onClick={toggleUserDetails} className="flex items-center space-x-2 cursor-pointer hover:bg-primary-xl px-3 py-2 rounded-full transition-colors">
            <div className="w-8 h-8 bg-primary-md rounded-full flex items-center justify-center">
              <User size={16} className="text-primary-lt" />
            </div>
          </div>
          <UserDropdown isOpen={isUserDetailsVisible} user={userData} onLogout={handleLogout} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
