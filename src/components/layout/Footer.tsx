import React, { useEffect, useState } from "react";
import axios from "axios";

const Footer: React.FC = () => {
  const [version, setVersion] = useState("...");

  useEffect(() => {
    axios.get("https://backend-slqi.onrender.com/api/version")
      .then((res) => {
        setVersion(res.data.version);
      });
  }, []);

  return (
    <footer className="w-full border-t font-bold border-border-secondary flex justify-between items-center text-xs text-primary py-4 px-6 bg-body min-h-[50px]">
      <span className="pl-[4.5rem]">
        <strong>Copyright © 2025–2026 Cashinvoice.</strong> All rights reserved
      </span>
      <span className="text-primary">Version {version}</span>
    </footer>
  );
};

export default Footer;