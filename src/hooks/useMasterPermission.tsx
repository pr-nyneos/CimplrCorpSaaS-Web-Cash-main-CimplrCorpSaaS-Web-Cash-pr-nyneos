import { useState, useEffect } from "react";
import nos from "../utils/nos";
const cURLHOST = import.meta.env.VITE_API_BASE_URL;
// 1. Define type
type MasterVisibleTab = {
  uploadTab: boolean;
  erpTab: boolean;
  allTab: boolean;
  manualEntryForm: boolean;
};

// 2. Custom hook
export const usePermissions = (masterKey: string) => {
  const [visibility, setVisibility] = useState<MasterVisibleTab>({
    uploadTab: false,
    erpTab: false,
    allTab: false,
    manualEntryForm: false,
  });

  const fetchPermissions = async () => {
    try {
      const response = await nos.post<any>(
        `${cURLHOST}/uam/permissions/permissions-json`
      );
      const pages = response.data?.pages;
      const userTabs = pages?.[masterKey]?.tabs;

      if (userTabs) {
        setVisibility({
          uploadTab: userTabs.uploadTab?.hasAccess || false,
          erpTab: userTabs.erpTab?.hasAccess || false,
          allTab: userTabs.allTab?.hasAccess || false,
          manualEntryForm: userTabs.manualEntryForm?.hasAccess || false,
        });
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [masterKey]);

  return visibility;
};
