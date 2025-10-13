import { useState, useEffect } from "react";
import nos from "../utils/nos";
const cURLHOST = import.meta.env.VITE_API_BASE_URL;

type AllTabActionButton = {
  approve: boolean;
  reject: boolean;
  edit: boolean;
  delete: boolean;
};

export const useAllTabPermissions = (masterKey: string) => {
  const [visibility, setVisibility] = useState<AllTabActionButton>({
    approve: true,
    reject: true,
    edit: true,
    delete: true,
  });

  const fetchPermissions = async () => {
    try {
      const response = await nos.post<any>(
        `${cURLHOST}/uam/permissions/permissions-json`
      );

      const pages = response.data?.pages;
      const userTabs = pages?.[masterKey]?.tabs;

      if (userTabs?.allTab) {
        setVisibility({
          approve: userTabs.allTab.showApproveButton || false,
          reject: userTabs.allTab.showRejectButton || false,
          edit: userTabs.allTab.showEditButton || false,
          delete: userTabs.allTab.showDeleteButton || false,
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
