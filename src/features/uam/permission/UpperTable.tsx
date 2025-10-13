// import axios from "axios";
import React, { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import LoadingSpinner from "../../../components/layout/LoadingSpinner";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification";

import nos from "../../../utils/nos";
// const cURLHOST = "https://cimplrcorpsaas-go-ci.onrender.com";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

interface prop {
  roleName: string;
}

type PermissionAttributes = {
  hasAccess: boolean;
  showCreateButton: boolean;
  showEditButton: boolean;
  showDeleteButton: boolean;
  showApproveButton: boolean;
  showRejectButton: boolean;
  canView: boolean;
  canUpload: boolean;
};

type PagePermissions = {
  hasAccess: boolean;
};

type PageTabs = {
  [tab: string]: PermissionAttributes;
};

type PagePermissionData = {
  pagePermissions: PagePermissions;
  tabs: PageTabs;
};

type PermissionData = {
  role_name: string;
  pages: {
    [pageKey: string]: PagePermissionData;
  };
};

const defaultPermissionAttributes: PermissionAttributes = {
  hasAccess: false,
  showCreateButton: false,
  showEditButton: false,
  showDeleteButton: false,
  showApproveButton: false,
  showRejectButton: false,
  canView: false,
  canUpload: false,
};

const pageList = [
  { key: "entity", label: "Entity" },
  { key: "hierarchical", label: "Hierarchical" },
  { key: "masters", label: "Masters" },
  { key: "dashboard", label: "Dashboard" },
  { key: "exposure-bucketing", label: "Exposure Bucketing" },
  { key: "hedging-proposal", label: "Hedging Proposal" },
  // { key: "hedging-dashboard", label: "Hedging Dashboard" },
  // { key: "fxstatusdash", label: "FX Status Dashboard" },
  { key: "roles", label: "Roles" },
  { key: "permissions", label: "Permissions" },
  { key: "user-creation", label: "User Creation" },
  { key: "exposure-upload", label: "Exposure Upload" },
  { key: "exposure-linkage", label: "Exposure Linkage" },
  { key: "fx-forward-booking", label: "FX Forward Booking" },
  { key: "forward-confirmation", label: "Forward Confirmation" },
  { key: "settlement", label: "Settlement" },
];

const masterPageList = [
  { key: "entity-master", label: "Entity Master" },
  { key: "currency-master", label: "Currency Master" },
  { key: "bank-master", label: "Bank Master" },
  { key: "payable-receivable-master", label: "Payable/Receivable Type Master" },
  { key: "cashflow-category-master", label: "Cash Flow Category Master" },
  { key: "bank-account-master", label: "Bank Account Master" },
  { key: "counterparty-master", label: "Counterparty Master" },
  { key: "gl-account-master", label: "GL Account Master" },
  { key: "cost-profit-center-master", label: "Cost Profit Center Master" },
];

const cashPageList = [
  { key: "bank-statement", label: "Bank Statement" },
  { key: "bank-balance", label: "Bank Balance" },
  { key: "transaction", label: "Transaction" },
  { key: "projection", label: "Projection" },
  { key: "fund-availability", label: "Fund Availability" },
];

const pagesWithTabs = [
  "roles",
  "permissions",
  "user-creation",
  "exposure-upload",
  "fx-forward-booking",
  "forward-confirmation",
  "settlement",
  ...masterPageList.map((p) => p.key),
  ...cashPageList.map((p) => p.key),
];

const tabLabels: Record<string, string> = {
  allTab: "All Tab",
  uploadTab: "Upload Tab",
  pendingTab: "Pending Tab",
  default: "Default",
  uploadFx: "Upload FX",
  fxForm: "FX Form",
  pendingForward: "Pending Forward",
  payment: "Payment",
  rollover: "Rollover",
  cancellation: "Cancellation",
  manualEntryForm: "Manual Entry Form",
  erpTab: "ERP Tab",
};

const permissionCheckboxes = [
  { key: "showCreateButton", label: "Add" },
  { key: "showEditButton", label: "Edit" },
  { key: "showDeleteButton", label: "Delete" },
  { key: "showApproveButton", label: "Approve" },
  { key: "showRejectButton", label: "Reject" },
  { key: "canView", label: "View" },
  { key: "canUpload", label: "Upload" },
];

const createPagePermissions = (tabs: string[] = ["default"]) => {
  const tabObj: Record<string, typeof defaultPermissionAttributes> = {};
  tabs.forEach((t) => (tabObj[t] = { ...defaultPermissionAttributes }));
  return {
    pagePermissions: { hasAccess: false },
    tabs: tabObj,
  };
};

const getTabsForPage = (pageKey: string) => {
  if (pageKey === "fx-forward-booking") {
    return ["uploadFx", "fxForm"];
  }
  if (pageKey === "forward-confirmation") {
    return ["uploadTab", "fxForm", "pendingForward"];
  }
  if (pageKey === "settlement") {
    return ["payment", "rollover", "cancellation"];
  }
  if (pageKey === "currency-master") {
    return ["erpTab", "allTab", "manualEntryForm"];
  }
  if (pageKey === "projection") {
    return ["allTab", "manualEntryForm"]; // no uploadTab, no erpTab
  }
  if (pageKey === "fund-availability") {
    return ["default"]; // only default tab
  }
  if (masterPageList.some((m) => m.key === pageKey)) {
    return ["uploadTab", "erpTab", "allTab", "manualEntryForm"];
  }
  if (cashPageList.some((m) => m.key === pageKey)) {
    return ["uploadTab", "erpTab", "allTab", "manualEntryForm"];
  }
  return pagesWithTabs.includes(pageKey)
    ? ["allTab", "uploadTab", "pendingTab"]
    : ["default"];
};

const masterPagesConfig: Record<string, PagePermissionData> =
  masterPageList.reduce((acc, { key }) => {
    acc[key] = createPagePermissions(getTabsForPage(key));
    return acc;
  }, {} as Record<string, PagePermissionData>);

const cashPagesConfig: Record<string, PagePermissionData> = cashPageList.reduce(
  (acc, { key }) => {
    acc[key] = createPagePermissions(getTabsForPage(key));
    return acc;
  },
  {} as Record<string, PagePermissionData>
);

const PermissionsTable: React.FC<prop> = ({ roleName }) => {
  const [loading, setLoading] = useState(false);
  const [permissionData, setPermissionData] = useState<PermissionData>({
    role_name: roleName,
    pages: {
      entity: {
        pagePermissions: { hasAccess: false },
        tabs: { default: { ...defaultPermissionAttributes } },
      },
      hierarchical: {
        pagePermissions: { hasAccess: false },
        tabs: { default: { ...defaultPermissionAttributes } },
      },
      masters: {
        pagePermissions: { hasAccess: false },
        tabs: { default: { ...defaultPermissionAttributes } },
      },
      dashboard: {
        pagePermissions: { hasAccess: false },
        tabs: { default: { ...defaultPermissionAttributes } },
      },
      "exposure-bucketing": {
        pagePermissions: { hasAccess: false },
        tabs: { default: { ...defaultPermissionAttributes } },
      },
      "hedging-proposal": {
        pagePermissions: { hasAccess: false },
        tabs: { default: { ...defaultPermissionAttributes } },
      },
      // "hedging-dashboard": { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
      // fxstatusdash: { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
      roles: {
        pagePermissions: { hasAccess: false },
        tabs: {
          allTab: { ...defaultPermissionAttributes },
          uploadTab: { ...defaultPermissionAttributes },
          pendingTab: { ...defaultPermissionAttributes },
        },
      },
      permissions: {
        pagePermissions: { hasAccess: false },
        tabs: {
          allTab: { ...defaultPermissionAttributes },
          uploadTab: { ...defaultPermissionAttributes },
          pendingTab: { ...defaultPermissionAttributes },
        },
      },
      "user-creation": {
        pagePermissions: { hasAccess: false },
        tabs: {
          allTab: { ...defaultPermissionAttributes },
          uploadTab: { ...defaultPermissionAttributes },
          pendingTab: { ...defaultPermissionAttributes },
        },
      },
      "exposure-upload": {
        pagePermissions: { hasAccess: false },
        tabs: {
          allTab: { ...defaultPermissionAttributes },
          uploadTab: { ...defaultPermissionAttributes },
          pendingTab: { ...defaultPermissionAttributes },
        },
      },
      "exposure-linkage": {
        pagePermissions: { hasAccess: false },
        tabs: { default: { ...defaultPermissionAttributes } },
      },
      "fx-forward-booking": {
        pagePermissions: { hasAccess: false },
        tabs: {
          uploadFx: { ...defaultPermissionAttributes },
          fxForm: { ...defaultPermissionAttributes },
        },
      },
      "forward-confirmation": {
        pagePermissions: { hasAccess: false },
        tabs: {
          uploadTab: { ...defaultPermissionAttributes },
          fxForm: { ...defaultPermissionAttributes },
          pendingForward: { ...defaultPermissionAttributes },
        },
      },
      settlement: {
        pagePermissions: { hasAccess: false },
        tabs: {
          payment: { ...defaultPermissionAttributes },
          rollover: { ...defaultPermissionAttributes },
          cancellation: { ...defaultPermissionAttributes },
        },
      },
      ...masterPagesConfig,
      ...cashPagesConfig,
    },
  });

  const { notify } = useNotification();

  // Helper to get tabs for a page

  // Get permissions for a page/tab (new API structure)
  const getPermissions = (
    pageKey: string,
    tab: string
  ): PermissionAttributes => {
    const page = permissionData.pages[pageKey];
    if (!page || !page.tabs) return { ...defaultPermissionAttributes };
    return page.tabs[tab] || { ...defaultPermissionAttributes };
  };

  // Helper to get page access (checked if all tabs have hasAccess true)
//   const getPageAccess = (pageKey: string) => {
//     const page = permissionData.pages[pageKey];
//     if (!page) return false;

//     // Use the pagePermissions.hasAccess if it exists, otherwise fall back to checking tabs
//     return (
//       page.pagePermissions?.hasAccess ||
//       Object.values(page.tabs).some((tab) => tab.hasAccess)
//     );
//   };
console.log("Permission Data:", permissionData);
const getPageAccess = (pageKey: string) => {
  const page = permissionData.pages[pageKey];
  if (!page) {
    console.warn(`Page ${pageKey} not found in permission data`);
    return false;
  }
  
  // For pages with explicit pagePermissions, use that value
  if (page.pagePermissions && typeof page.pagePermissions.hasAccess === 'boolean') {
    return page.pagePermissions.hasAccess;
  }
  
  // For pages without explicit pagePermissions, check if any tab has access
  return Object.values(page.tabs || {}).some((tab) => tab.hasAccess);
};

  // Update page access: set all tabs' hasAccess to the new value
  //   const updatePageAccess = (pageKey: string, hasAccess: boolean) => {
  //     console.log(`Updating page access for ${pageKey} to ${hasAccess}`);
  //     setPermissionData((prev) => {
  //       const page = prev.pages[pageKey];
  //       if (!page || !page.tabs) {
  //         // console.log(`No page or tabs found for ${pageKey}`);
  //         return prev;
  //       }
  //       const newTabs = Object.fromEntries(
  //         Object.entries(page.tabs).map(([tab, attrs]) => [
  //           tab,
  //           { ...attrs, hasAccess },
  //         ])
  //       );
  //       // console.log(`New tabs for ${pageKey}:`, newTabs);
  //       return {
  //         ...prev,
  //         pages: {
  //           ...prev.pages,
  //           [pageKey]: {
  //             ...page,
  //             pagePermissions: {
  //               ...page.pagePermissions,
  //               hasAccess,
  //             },
  //             tabs: newTabs,
  //           },
  //         },
  //       };
  //     });
  //   };
  const updatePageAccess = (pageKey: string, hasAccess: boolean) => {
  setPermissionData((prev) => {
    const page = prev.pages[pageKey];
    if (!page) {
      console.warn(`Page ${pageKey} not found when trying to update access`);
      return prev;
    }

    // Update all tabs to match the page access
    const updatedTabs = Object.fromEntries(
      Object.entries(page.tabs || {}).map(([tabKey, tabData]) => [
        tabKey,
        { ...tabData, hasAccess }
      ])
    );

    return {
      ...prev,
      pages: {
        ...prev.pages,
        [pageKey]: {
          ...page,
          pagePermissions: {
            ...page.pagePermissions,
            hasAccess
          },
          tabs: updatedTabs
        }
      }
    };
  });
};

  // Update tab access (new API structure)
  const updateTabAccess = (
    pageKey: string,
    tab: string,
    hasAccess: boolean
  ) => {
    setPermissionData((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageKey]: {
          ...prev.pages[pageKey],
          tabs: {
            ...prev.pages[pageKey]?.tabs,
            [tab]: {
              ...getPermissions(pageKey, tab),
              hasAccess,
            },
          },
        },
      },
    }));
  };

  // Normalize backend data to always have {tabs: {tab: {}}} structure for each page
  const normalizePermissions = (rawPages: any): PermissionData["pages"] => {
    const normalizedPages: PermissionData["pages"] = {};

    for (const [pageKey, pageValue] of Object.entries(rawPages)) {
      // Skip if pageValue is null or undefined
      if (!pageValue) {
        continue;
      }

      const tabs = getTabsForPage(pageKey);
      const tabsData: PageTabs = {};

      // Initialize with default values first
      tabs.forEach((tab) => {
        tabsData[tab] = { ...defaultPermissionAttributes };
      });

      // If tabs exist in the response, merge them
      if ((pageValue as any).tabs) {
        for (const [tab, tabData] of Object.entries(
          (pageValue as any).tabs as Record<string, any>
        )) {
          if (tabsData[tab]) {
            tabsData[tab] = {
              ...tabsData[tab],
              ...tabData,
            };
          }
        }
      }

      // Determine page-level access
      // const pageAccess =
      //   (pageValue as any).pagePermissions?.hasAccess ||
      //   Object.values(tabsData).some((tab) => tab.hasAccess);

      // normalizedPages[pageKey] = {
      //   pagePermissions: {
      //     hasAccess: (pageValue as any).pagePermissions?.hasAccess || false,
      //   },
      //   tabs: tabsData,
      // };
    }

    // Ensure all expected pages exist, even if not in API response
    pageList.forEach((page) => {
      if (!normalizedPages[page.key]) {
        const tabs = getTabsForPage(page.key);
        const tabsData: PageTabs = {};

        tabs.forEach((tab) => {
          tabsData[tab] = { ...defaultPermissionAttributes };
        });

        normalizedPages[page.key] = {
          pagePermissions: { hasAccess: false },
          tabs: tabsData,
        };
      }
    });

    masterPageList.forEach((page) => {
      if (!normalizedPages[page.key]) {
        const tabs = getTabsForPage(page.key);
        const tabsData: PageTabs = {};
        tabs.forEach((tab) => {
          tabsData[tab] = { ...defaultPermissionAttributes };
        });
        normalizedPages[page.key] = {
          pagePermissions: { hasAccess: false },
          tabs: tabsData,
        };
      }
    });

    // Add cash pages
    cashPageList.forEach((page) => {
      if (!normalizedPages[page.key]) {
        const tabs = getTabsForPage(page.key);
        const tabsData: PageTabs = {};
        tabs.forEach((tab) => {
          tabsData[tab] = { ...defaultPermissionAttributes };
        });
        normalizedPages[page.key] = {
          pagePermissions: { hasAccess: false },
          tabs: tabsData,
        };
      }
    });

    return normalizedPages;
  };

  // Update permission checkbox (new API structure)
  const updatePermissionCheckbox = (
    pageKey: string,
    tab: string,
    field: keyof PermissionAttributes,
    value: boolean
  ) => {
    setPermissionData((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageKey]: {
          ...prev.pages[pageKey],
          tabs: {
            ...prev.pages[pageKey]?.tabs,
            [tab]: {
              ...getPermissions(pageKey, tab),
              [field]: value,
            },
          },
        },
      },
    }));
  };

  // console.log("Permission data:", permissionData);

  // Fetch permission data from API
  useEffect(() => {
    const fetchPermissionData = async () => {
      try {
        setLoading(true);
        const response = await nos.post<any>(
          `${apiBaseUrl}/uam/permissions/permissions-json`,
          // { roleName }
        );
        console.log("Response data :", response.data);
        if (
          !response.data.pages ||
          Object.keys(response.data.pages).length === 0
        ) {
          // Set all permissions to false, but allow editing by not disabling checkboxes
          setPermissionData({
            role_name: roleName,
            pages: {
              entity: {
                pagePermissions: { hasAccess: false },
                tabs: { default: { ...defaultPermissionAttributes } },
              },
              hierarchical: {
                pagePermissions: { hasAccess: false },
                tabs: { default: { ...defaultPermissionAttributes } },
              },
              masters: {
                pagePermissions: { hasAccess: false },
                tabs: { default: { ...defaultPermissionAttributes } },
              },
              dashboard: {
                pagePermissions: { hasAccess: false },
                tabs: { default: { ...defaultPermissionAttributes } },
              },
              "exposure-bucketing": {
                pagePermissions: { hasAccess: false },
                tabs: { default: { ...defaultPermissionAttributes } },
              },
              "hedging-proposal": {
                pagePermissions: { hasAccess: false },
                tabs: { default: { ...defaultPermissionAttributes } },
              },
              roles: {
                pagePermissions: { hasAccess: false },
                tabs: {
                  allTab: { ...defaultPermissionAttributes },
                  uploadTab: { ...defaultPermissionAttributes },
                  pendingTab: { ...defaultPermissionAttributes },
                },
              },
              permissions: {
                pagePermissions: { hasAccess: false },
                tabs: {
                  allTab: { ...defaultPermissionAttributes },
                  uploadTab: { ...defaultPermissionAttributes },
                  pendingTab: { ...defaultPermissionAttributes },
                },
              },
              "user-creation": {
                pagePermissions: { hasAccess: false },
                tabs: {
                  allTab: { ...defaultPermissionAttributes },
                  uploadTab: { ...defaultPermissionAttributes },
                  pendingTab: { ...defaultPermissionAttributes },
                },
              },
              "exposure-upload": {
                pagePermissions: { hasAccess: false },
                tabs: {
                  allTab: { ...defaultPermissionAttributes },
                  uploadTab: { ...defaultPermissionAttributes },
                  pendingTab: { ...defaultPermissionAttributes },
                },
              },
              "exposure-linkage": {
                pagePermissions: { hasAccess: false },
                tabs: { default: { ...defaultPermissionAttributes } },
              },
              "fx-forward-booking": {
                pagePermissions: { hasAccess: false },
                tabs: {
                  uploadFx: { ...defaultPermissionAttributes },
                  fxForm: { ...defaultPermissionAttributes },
                },
              },
              "forward-confirmation": {
                pagePermissions: { hasAccess: false },
                tabs: {
                  uploadTab: { ...defaultPermissionAttributes },
                  fxForm: { ...defaultPermissionAttributes },
                  pendingForward: { ...defaultPermissionAttributes },
                },
              },
              settlement: {
                pagePermissions: { hasAccess: false },
                tabs: {
                  payment: { ...defaultPermissionAttributes },
                  rollover: { ...defaultPermissionAttributes },
                  cancellation: { ...defaultPermissionAttributes },
                },
              },

              ...masterPagesConfig,
              ...cashPagesConfig,
            },
          });
          return;
        }

        if (response.data && response.data.pages) {
          setPermissionData({
            role_name: response.data.roleName,
            pages: normalizePermissions(response.data.pages),
          });
        } else {
          notify("Permission data not found.", "error");
        }
      } catch (err) {
        notify(`Failed to load permission data: ${err}`, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPermissionData();
  }, [roleName]);

  // console.log("Permission data:", permissionData);

  // Submit/save handler
  const handleSave = async () => {
    const dataToSend = {
      roleName: permissionData.role_name,
      pages: permissionData.pages,
    };
    
    // console.log("Data to send:", dataToSend);
    try {
      setLoading(true);
      const response = await nos.post<any>(
        `${apiBaseUrl}/uam/permissions/upsert-role-permissions`,
        dataToSend
      );
      console.log("Response2 ww:", response.data);
      if (response.data.success) {
        notify("Permissions saved successfully!", "success");
      } else {
        notify("Error saving permissions: " + response.data.error, "error");
      }
    } catch (err) {
      notify(`Request failed. Check console: ${err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-text">
            Role Permissions Management
          </h1>
        </div>
        <div>
          <Button onClick={handleSave}>Submit</Button>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="shadow-lg border border-border">
          <table className="min-w-full">
            <thead className="bg-body rounded-xl">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border text-start">
                  Page Name
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border">
                  Page Access
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border text-start">
                  Tab Access
                </th>
                {permissionCheckboxes.map((perm) => (
                  <th
                    key={perm.key}
                    className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border"
                  >
                    {perm.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageList.map((page) => {
                const tabs = getTabsForPage(page.key);
                return tabs.map((tab, tabIdx) => {
                  // const pageAccess = getPageAccess(page.key);
                  const tabPerms = getPermissions(page.key, tab);
                  return (
                    <tr
                      key={page.key + "-" + tab}
                      className={
                        tabIdx % 2 === 0
                          ? "bg-primary-md"
                          : "bg-secondary-color-lt"
                      }
                    >
                      {tabIdx === 0 ? (
                        <td
                          rowSpan={tabs.length}
                          className="px-4 py-3 font-semibold text-secondary-text-dark capitalize align-middle"
                        >
                          {page.label}
                        </td>
                      ) : null}
                      <td className="px-4 py-3 text-center align-middle">
                        {tabIdx === 0 ? (
                          <input
                            type="checkbox"
                            checked={getPageAccess(page.key)}
                            onChange={(e) => {
                              // console.log(`Page access checkbox clicked for ${page.key}, checked: ${e.target.checked}`);
                              updatePageAccess(page.key, e.target.checked);
                            }}
                            style={{ pointerEvents: "auto", zIndex: 10 }}
                            className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-start align-middle flex justify-between">
                        {tabs.length > 1 ? (
                          <>
                            <span className="mr-2 text-sm font-normal text-secondary-text">
                              {tabLabels[tab]}
                            </span>
                            <input
                              type="checkbox"
                              checked={tabPerms.hasAccess}
                              onChange={(e) =>
                                updateTabAccess(page.key, tab, e.target.checked)
                              }
                              disabled={!getPageAccess(page.key)}
                              className="mr-[5rem] accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </>
                        ) : (
                          <span className="text-xs text-secondary-text">-</span>
                        )}
                      </td>
                      {permissionCheckboxes.map((perm) => (
                        <td
                          key={perm.key}
                          className="px-4 py-3 text-center align-middle"
                        >
                          <input
                            type="checkbox"
                            checked={
                              tabPerms[perm.key as keyof PermissionAttributes]
                            }
                            onChange={(e) =>
                              updatePermissionCheckbox(
                                page.key,
                                tab,
                                perm.key as keyof PermissionAttributes,
                                e.target.checked
                              )
                            }
                            disabled={
                              !getPageAccess(page.key) ||
                              (tabs.length > 1 ? !tabPerms.hasAccess : false)
                            }
                            className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-secondary-text mt-8 mb-4">
          Master Permissions
        </h1>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="shadow-lg border border-border">
          <table className="min-w-full">
            <thead className="bg-body rounded-xl">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border text-start">
                  Page Name
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border">
                  Page Access
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border text-start">
                  Tab Access
                </th>
                {permissionCheckboxes.map((perm) => (
                  <th
                    key={perm.key}
                    className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border"
                  >
                    {perm.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {masterPageList.map((page) => {
                const tabs = getTabsForPage(page.key);
                return tabs.map((tab, tabIdx) => {
                  // const pageAccess = getPageAccess(page.key);
                  const tabPerms = getPermissions(page.key, tab);
                  return (
                    <tr
                      key={page.key + "-" + tab}
                      className={
                        tabIdx % 2 === 0
                          ? "bg-primary-md"
                          : "bg-secondary-color-lt"
                      }
                    >
                      {tabIdx === 0 ? (
                        <td
                          rowSpan={tabs.length}
                          className="px-4 py-3 font-semibold text-secondary-text-dark capitalize align-middle"
                        >
                          {page.label}
                        </td>
                      ) : null}
                      <td className="px-4 py-3 text-center align-middle">
                        {tabIdx === 0 ? (
                          <input
                            type="checkbox"
                            checked={getPageAccess(page.key)}
                            onChange={(e) => {
                              // console.log(`Page access checkbox clicked for ${page.key}, checked: ${e.target.checked}`);
                              updatePageAccess(page.key, e.target.checked);
                            }}
                            style={{ pointerEvents: "auto", zIndex: 10 }}
                            className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-start align-middle flex justify-between">
                        {tabs.length > 1 ? (
                          <>
                            <span className="mr-2 text-sm font-normal text-secondary-text">
                              {tabLabels[tab]}
                            </span>
                            <input
                              type="checkbox"
                              checked={tabPerms.hasAccess}
                              onChange={(e) =>
                                updateTabAccess(page.key, tab, e.target.checked)
                              }
                              disabled={!getPageAccess(page.key)}
                              className="mr-[5rem] accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </>
                        ) : (
                          <span className="text-xs text-secondary-text">-</span>
                        )}
                      </td>
                      {permissionCheckboxes.map((perm) => (
                        <td
                          key={perm.key}
                          className="px-4 py-3 text-center align-middle"
                        >
                          <input
                            type="checkbox"
                            checked={
                              tabPerms[perm.key as keyof PermissionAttributes]
                            }
                            onChange={(e) =>
                              updatePermissionCheckbox(
                                page.key,
                                tab,
                                perm.key as keyof PermissionAttributes,
                                e.target.checked
                              )
                            }
                            disabled={
                              !getPageAccess(page.key) ||
                              (tabs.length > 1 ? !tabPerms.hasAccess : false)
                            }
                            className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-secondary-text mt-8 mb-4">
          Cash Permissions
        </h1>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="shadow-lg border border-border">
          <table className="min-w-full">
            <thead className="bg-body rounded-xl">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border text-start">
                  Page Name
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border">
                  Page Access
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border text-start">
                  Tab Access
                </th>
                {permissionCheckboxes.map((perm) => (
                  <th
                    key={perm.key}
                    className="px-4 py-3 text-sm font-semibold text-primary uppercase border-b border-border"
                  >
                    {perm.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cashPageList.map((page) => {
                const tabs = getTabsForPage(page.key);
                return tabs.map((tab, tabIdx) => {
                  // const pageAccess = getPageAccess(page.key);
                  const tabPerms = getPermissions(page.key, tab);
                  return (
                    <tr
                      key={page.key + "-" + tab}
                      className={
                        tabIdx % 2 === 0
                          ? "bg-primary-md"
                          : "bg-secondary-color-lt"
                      }
                    >
                      {tabIdx === 0 ? (
                        <td
                          rowSpan={tabs.length}
                          className="px-4 py-3 font-semibold text-secondary-text-dark capitalize align-middle"
                        >
                          {page.label}
                        </td>
                      ) : null}
                      <td className="px-4 py-3 text-center align-middle">
                        {tabIdx === 0 ? (
                          <input
                            type="checkbox"
                            checked={getPageAccess(page.key)}
                            onChange={(e) => {
                              // console.log(`Page access checkbox clicked for ${page.key}, checked: ${e.target.checked}`);
                              updatePageAccess(page.key, e.target.checked);
                            }}
                            style={{ pointerEvents: "auto", zIndex: 10 }}
                            className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-start align-middle flex justify-between">
                        {tabs.length > 1 ? (
                          <>
                            <span className="mr-2 text-sm font-normal text-secondary-text">
                              {tabLabels[tab]}
                            </span>
                            <input
                              type="checkbox"
                              checked={tabPerms.hasAccess}
                              onChange={(e) =>
                                updateTabAccess(page.key, tab, e.target.checked)
                              }
                              disabled={!getPageAccess(page.key)}
                              className="mr-[5rem] accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </>
                        ) : (
                          <span className="text-xs text-secondary-text">-</span>
                        )}
                      </td>
                      {permissionCheckboxes.map((perm) => (
                        <td
                          key={perm.key}
                          className="px-4 py-3 text-center align-middle"
                        >
                          <input
                            type="checkbox"
                            checked={
                              tabPerms[perm.key as keyof PermissionAttributes]
                            }
                            onChange={(e) =>
                              updatePermissionCheckbox(
                                page.key,
                                tab,
                                perm.key as keyof PermissionAttributes,
                                e.target.checked
                              )
                            }
                            disabled={
                              !getPageAccess(page.key) ||
                              (tabs.length > 1 ? !tabPerms.hasAccess : false)
                            }
                            className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PermissionsTable;
