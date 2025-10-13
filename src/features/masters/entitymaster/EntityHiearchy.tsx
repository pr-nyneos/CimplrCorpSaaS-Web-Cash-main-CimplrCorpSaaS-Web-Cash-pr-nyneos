//
import {
  Building,
  Building2,
  ChevronDown,
  ChevronRight,
  Trash2,
  // Edit,
} from "lucide-react";
import React, { useEffect, useState } from "react";
// import Layout from "../../../components/layout/Layout.tsx";
import LoadingSpinner from "../../../components/layout/LoadingSpinner.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import Button from "../../../components/ui/Button.tsx";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
type ApprovalStatus = "pending" | "approved" | "rejected" | "delete-approval";

import type { TreeNodeType } from "../../../types/masterType";
import nos from "../../../utils/nos.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const getNodeConfig = (level: string | number) => {
  // Accept both string and number, convert number to string for switch
  const levelStr = typeof level === "number" ? `Level ${level}` : level;
  switch (levelStr) {
    case "Level 1":
      return {
        icon: Building,
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
      };
    case "Level 2":
      return {
        icon: Building2,
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
      };
    case "Level 3":
      return {
        icon: Building2,
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-800",
      };
    case "Level 4":
      return {
        icon: Building2,
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
      };
    default:
      return {
        icon: Building,
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-800",
      };
  }
};

// type TabVisibility = {
//   approve: boolean;
//   reject: boolean;
//   edit: boolean;
// };

const HierarchicalTree = () => {
  const [, setApprovalComment] = useState("");
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNodeType | null>(null);
  // const [Visibility, ] = useState<TabVisibility>({
  //   approve: true,
  //   reject: true,
  //   edit: true,
  // });
  const [loading, setLoading] = useState(true); // 👈 Loading state
  const visibility = useAllTabPermissions("entity-master");

  const { notify, confirm } = useNotification();
  const [treeData, setTreeData] = useState<
    TreeNodeType | TreeNodeType[] | null
  >(null);
  const lineColors = [
    "border-l-blue-600",
    "border-l-green-600",
    "border-l-yellow-600",
    "border-l-purple-600",
  ];

  useEffect(() => {
    const syncAndFetchHierarchy = async () => {
      try {
        // await axios.post(`${apiBaseUrl}/entity/sync-relationships`);
        const response = await nos.post<TreeNodeType[]>(
          `${apiBaseUrl}/master/entitycash/hierarchy`
        );
        if (response.data && response.data.length > 0) {
          setTreeData(response.data);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    syncAndFetchHierarchy();
  }, []);

  useEffect(() => {
    if (treeData) {
      localStorage.setItem("treeData", JSON.stringify(treeData));
    }
  }, [treeData]);

  const findNodeByIdUniversal = (
    node: TreeNodeType | TreeNodeType[],
    nodeId: string
  ): TreeNodeType | null => {
    if (Array.isArray(node)) {
      for (const n of node) {
        const found = findNodeByIdUniversal(n, nodeId);
        if (found) return found;
      }
      return null;
    }
    if (node.id === nodeId) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeByIdUniversal(child, nodeId);
        if (found) return found;
      }
    }
    return null;
  };

  const getAllNodeIds = (
    node: TreeNodeType | TreeNodeType[] | null
  ): string[] => {
    if (!node) return [];

    if (Array.isArray(node)) {
      return node.flatMap((n) => {
        const ids = [n.id];
        if (n.children) {
          ids.push(...getAllNodeIds(n.children));
        }
        return ids;
      });
    }

    const ids = [node.id];
    if (node.children) {
      node.children.forEach((child) => {
        ids.push(...getAllNodeIds(child));
      });
    }
    return ids;
  };

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (treeData && selectedNode) {
      const node = findNodeByIdUniversal(treeData, selectedNode.id);
      setSelectedNode(node || null);
    }
  }, [treeData, selectedNode?.id]);

  useEffect(() => {
    if (treeData) {
      if (isAllExpanded) {
        const allNodeIds = getAllNodeIds(treeData);
        setExpandedNodes(new Set(allNodeIds));
      } else {
        setExpandedNodes(new Set());
      }
    }
  }, [treeData, isAllExpanded]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      newSet.has(nodeId) ? newSet.delete(nodeId) : newSet.add(nodeId);
      return newSet;
    });
  };

  const toggleAllNodes = () => {
    if (isAllExpanded) {
      setExpandedNodes(new Set());
    } else {
      const allNodeIds = getAllNodeIds(treeData);
      setExpandedNodes(new Set(allNodeIds));
    }
    setIsAllExpanded(!isAllExpanded);
  };

  const deleteNode = (
    nodeId: string,
    currentNode: TreeNodeType | TreeNodeType[] | null
  ): TreeNodeType | TreeNodeType[] | null => {
    if (!currentNode) return null;
    if (Array.isArray(currentNode)) {
      const pruned = currentNode
        .map((child) => deleteNode(nodeId, child))
        .filter((child): child is TreeNodeType => child !== null);
      return pruned;
    }
    if (currentNode.id === nodeId) return null;
    if (currentNode.children) {
      const updatedChildren = currentNode.children
        .map((child) => deleteNode(nodeId, child) as TreeNodeType | null)
        .filter((child): child is TreeNodeType => child !== null);
      return {
        ...currentNode,
        children: updatedChildren.length > 0 ? updatedChildren : undefined,
      };
    }
    return currentNode;
  };

  const updateApprovalStatus = (nodeId: string, status: ApprovalStatus) => {
    const setStatusForAllDescendants = (
      node: TreeNodeType,
      status: ApprovalStatus
    ): TreeNodeType => ({
      ...node,
      data: {
        ...node.data,
        processing_status: status,
      },
      children: node.children?.map((child) =>
        setStatusForAllDescendants(child, status)
      ),
    });

    const updateStatus = (node: TreeNodeType): TreeNodeType => {
      if (node.id === nodeId) {
        if (status === "rejected") {
          return setStatusForAllDescendants(node, "rejected");
        } else {
          return {
            ...node,
            data: {
              ...node.data,
              processing_status: status,
            },
          };
        }
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateStatus),
        };
      }
      return node;
    };

    if (Array.isArray(treeData)) {
      // setTreeData(treeData.map(updateStatus));
    } else if (treeData) {
      setTreeData(updateStatus(treeData));
    }
  };

  // const approveAllNodes = () => {
  //   const approveAll = (node: TreeNodeType): TreeNodeType => {
  //     return {
  //       ...node,
  //       data: {
  //         ...node.data,
  //         processing_status: "approved",
  //       },
  //       children: node.children?.map(approveAll),
  //     };
  //   };

  //   if (treeData) {
  //     setTreeData(approveAll(treeData));
  //   }
  // };

  // Component for rendering node details
  const TreeNodeDetails = ({
    node,
    onUpdateNode,
  }: {
    node: TreeNodeType;
    onUpdateNode: (updatedData: TreeNodeType["data"]) => void;
  }) => {
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
      entityID: node.data.entity_id || "",
      entityName: node.data.entity_name || "",
      entityShortName: node.data.entity_short_name || "",
      entityLevel: node.data.entity_level,
      parentEntity: node.data.parent_entity || "",
      entityRegistrationNumber: node.data.entity_registration_number || "",
      country: node.data.country || "",
      baseOperatingCurrency: node.data.base_operating_currency || "",
      taxIdentificationNumber: node.data.tax_identification_number || "",
      addressLine1: node.data.address_line1 || "",
      addressLine2: node.data.address_line2 || "",
      city: node.data.city || "",
      stateProvince: node.data.state_province || "",
      postalCode: node.data.postal_code || "",
      contactPersonName: node.data.contact_person_name || "",
      contactPersonEmail: node.data.contact_person_email || "",
      contactPersonPhone: node.data.contact_person_phone || "",
      activeStatus: node.data.active_status || "",
      processingStatus: node.data.processing_status || "",
    });

    useEffect(() => {
      setFormData({
        entityID: node.data.entity_id || "",
        entityName: node.data.entity_name || "",
        entityShortName: node.data.entity_short_name || "",
        entityLevel: node.data.entity_level,
        parentEntity: node.data.parent_entity || "",
        entityRegistrationNumber: node.data.entity_registration_number || "",
        country: node.data.country || "",
        baseOperatingCurrency: node.data.base_operating_currency || "",
        taxIdentificationNumber: node.data.tax_identification_number || "",
        addressLine1: node.data.address_line1 || "",
        addressLine2: node.data.address_line2 || "",
        city: node.data.city || "",
        stateProvince: node.data.state_province || "",
        postalCode: node.data.postal_code || "",
        contactPersonName: node.data.contact_person_name || "",
        contactPersonEmail: node.data.contact_person_email || "",
        contactPersonPhone: node.data.contact_person_phone || "",
        activeStatus: node.data.active_status || "",
        processingStatus: node.data.processing_status || "",
      });
      setEditing(false);
    }, [node]);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e?: React.FormEvent) => {
      if (e && typeof e.preventDefault === "function") {
        e.preventDefault();
      }
      try {
        // Prepare the bulk update payload as per backend requirements
        const payload = {
          // user_id: node.data.user_id || "", // user_id not present in type, omit or set to a static value if required
          entities: [
            {
              entity_id: node.data.entity_id,
              fields: {
                entity_name: formData.entityName || null,
                entity_short_name: formData.entityShortName || null,
                entity_level: formData.entityLevel || null,
                parent_entity: formData.parentEntity || null,
                entity_registration_number:
                  formData.entityRegistrationNumber || null,
                country: formData.country || null,
                base_operating_currency: formData.baseOperatingCurrency || null,
                tax_identification_number:
                  formData.taxIdentificationNumber || null,
                address_line1: formData.addressLine1 || null,
                address_line2: formData.addressLine2 || null,
                city: formData.city || null,
                state_province: formData.stateProvince || null,
                postal_code: formData.postalCode || null,
                contact_person_name: formData.contactPersonName || null,
                contact_person_email: formData.contactPersonEmail || null,
                contact_person_phone: formData.contactPersonPhone || null,
                active_status: formData.activeStatus || null,
                is_deleted: false,
                processing_status: formData.processingStatus || null,
              },
              reason: "UI update",
            },
          ],
        };

        const response = await nos.post<any>(
          `${apiBaseUrl}/master/entitycash/updatebulk`,

          payload
        );

        if (!response.data.success) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        notify("Entity updated successfully!", "success");
        onUpdateNode({
          ...node.data,
          // entityID : formData.entityID,
          entity_name: formData.entityName,
          entity_short_name: formData.entityShortName,
          entity_level: formData.entityLevel,
          parent_entity: formData.parentEntity,
          entity_registration_number: formData.entityRegistrationNumber,
          country: formData.country,
          base_operating_currency: formData.baseOperatingCurrency,
          tax_identification_number: formData.taxIdentificationNumber,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2,
          city: formData.city,
          state_province: formData.stateProvince,
          postal_code: formData.postalCode,
          contact_person_name: formData.contactPersonName,
          contact_person_email: formData.contactPersonEmail,
          contact_person_phone: formData.contactPersonPhone,
          active_status: formData.activeStatus,
        });
        setEditing(false);
      } catch (error) {
        notify(
          "Failed to update entity. Please check your input or try again later.",
          "error"
        );
      }
    };

    // const handleSave = () => {
    //   // You can add logic to update the node in the tree here
    //   setEditing(false);
    //   // Optionally, call a prop or context to update the treeData
    // };

    return (
      <div className="bg-secondary-color rounded-lg border border-border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-primary font-bold">
            {node.data.entity_name || "Entity Details"}
          </h2>
          <div className="w-[5rem] flex justify-end">
            {visibility.edit && (
              <Button
                categories="Medium"
                color="Fade"
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing ? "Cancel" : "Edit"}
              </Button>
            )}
          </div>
        </div>
        {editing ? (
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSave}
          >
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-primary">Entity ID</label>
                <input
                  name="entityId"
                  value={formData.entityID}
                  readOnly
                  className="w-full border rounded px-2 py-1 bg-gray-100 text-secondary-text outline-none border-border cursor-not-allowed"
                  tabIndex={-1}
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Entity Name
                </label>
                <input
                  name="entityName"
                  value={formData.entityName}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-gray-100 text-secondary-text outline-none border-border cursor-not-allowed"
                  tabIndex={-1}
                  required
                  readOnly
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Entity Short Name
                </label>
                <input
                  name="entityShortName"
                  value={formData.entityShortName}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Entity Level
                </label>
                <input
                  name="entityLevel"
                  value={formData.entityLevel}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-gray-100 text-secondary-text outline-none border-border cursor-not-allowed"
                  tabIndex={-1}
                  readOnly
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Parent Entity
                </label>
                <input
                  name="parentEntity"
                  value={formData.parentEntity}
                  onChange={handleChange}
                  readOnly
                  className="w-full border rounded px-2 py-1 bg-gray-100 text-secondary-text outline-none border-border cursor-not-allowed"
                  tabIndex={-1}
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Entity Registration Number
                </label>
                <input
                  name="entityRegistrationNumber"
                  value={formData.entityRegistrationNumber}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="font-semibold text-primary">Country</label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Base Operating Currency
                </label>
                <input
                  name="baseOperatingCurrency"
                  value={formData.baseOperatingCurrency}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Tax Identification Number
                </label>
                <input
                  name="taxIdentificationNumber"
                  value={formData.taxIdentificationNumber}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  maxLength={50}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-primary">
                  Address Line 1
                </label>
                <input
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Address Line 2
                </label>
                <input
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="font-semibold text-primary">City</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  State/Province
                </label>
                <input
                  name="stateProvince"
                  value={formData.stateProvince}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Postal Code
                </label>
                <input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Contact Person Name
                </label>
                <input
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Contact Person Email
                </label>
                <input
                  name="contactPersonEmail"
                  value={formData.contactPersonEmail}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                  type="email"
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Contact Person Phone
                </label>
                <input
                  name="contactPersonPhone"
                  value={formData.contactPersonPhone}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                />
              </div>
              <div>
                <label className="font-semibold text-primary">
                  Active Status
                </label>
                <input
                  name="activeStatus"
                  value={formData.activeStatus}
                  onChange={handleChange}
                  className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                />
              </div>
            </div>
            <div className="col-span-2 flex justify-end mt-4">
              <Button categories="Large" color="Green" type="submit">
                Save
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-primary">Entity ID</h3>
                <p className="text-secondary-text-dark">
                  {node.data.entity_id}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary">Entity Name</h3>
                <p className="text-secondary-text-dark">
                  {node.data.entity_name}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  Entity Short Name
                </h3>
                <p className="text-secondary-text-dark">
                  {node.data.entity_short_name}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">Entity Level</h3>
                <p className="text-secondary-text-dark">
                  {node.data.entity_level}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">Parent Entity</h3>
                <p className="text-secondary-text-dark">
                  {node.data.parent_entity}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  Entity Registration Number
                </h3>
                <p className="text-secondary-text-dark">
                  {node.data.entity_registration_number}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">Country</h3>
                <p className="text-secondary-text-dark">{node.data.country}</p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  Base Operating Currency
                </h3>
                <p className="text-secondary-text-dark">
                  {node.data.base_operating_currency}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  Tax Identification Number
                </h3>
                <p className="text-secondary-text-dark">
                  {node.data.tax_identification_number}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-primary">Address Line 1</h3>
                <p className="text-secondary-text-dark">
                  {node.data.address_line1}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">Address Line 2</h3>
                <p className="text-secondary-text-dark">
                  {node.data.address_line2}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">City</h3>
                <p className="text-secondary-text-dark">{node.data.city}</p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">State/Province</h3>
                <p className="text-secondary-text-dark">
                  {node.data.state_province}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">Postal Code</h3>
                <p className="text-secondary-text-dark">
                  {node.data.postal_code}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  Contact Person Name
                </h3>
                <p className="text-secondary-text-dark">
                  {node.data.contact_person_name}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  Contact Person Email
                </h3>
                <p className="text-secondary-text-dark">
                  {node.data.contact_person_email}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  Contact Person Phone
                </h3>
                <p className="text-secondary-text-dark">
                  {node.data.contact_person_phone}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary">Active Status</h3>
                <p className="text-secondary-text-dark">
                  {node.data.active_status}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  // `${apiBaseUrl}/master/entitycash/bulk-approve`
  const handleApprove = async (entityId: string) => {
    try {
      const confirmResult = await confirm(`Are you sure you want to approve`, {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      });
      if (!confirmResult.confirmed) return;

      const response = await nos.post<any>(
        `${apiBaseUrl}/master/entitycash/bulk-approve`,
        { entity_ids: [entityId], comments: confirmResult.inputValue || "" }
      );

      if (!response.data.success) {
        throw new Error(`Approval failed. Status: ${response.data.error}`);
      }

      // alert("Entity approved successfully!");
      notify("Entity approved successfully!", "success");

      // Optionally update UI or clear comment:
      setApprovalComment("");
    } catch (error) {
      // alert("Failed to approve entity.");
      notify("Failed to approve entity. Please try again.", "error");
    }
  };

  const handleRejectBulk = async (entityIds: string[]) => {
    try {
      const confirmResult = await confirm(`Are you sure you want to reject`, {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      });
      if (!confirmResult.confirmed) return;

      const response = await nos.post<any>(
        `${apiBaseUrl}/master/entitycash/bulk-reject`,
        { entity_ids: entityIds, comments: confirmResult.inputValue || "" }
      );

      if (!response.data.success) {
        throw new Error(`Approval failed. Status: ${response.data.error}`);
      }

      // alert("Entity approved successfully!");
      notify("Entity Rejected successfully!", "success");

      // Optionally update UI or clear comment:
      setApprovalComment("");
    } catch (error) {
      // alert("Failed to approve entity.");
      notify("Failed to Reject entity. Please try again.", "error");
    }
  };

  const handleDelete = async (node: TreeNodeType) => {
    const confirmed = await confirm(
      `Delete ${node.name} and all its children?`
    );
    if (!confirmed) return;

    try {
      const response = await nos.post<any>(
        `${apiBaseUrl}/master/entitycash/delete`,
        {
          entity_id: node.data.entity_id,
          reason: "Deleted via UI",
        }
      );

      if (!response.data.success) {
        throw new Error(`Delete failed. Status: ${response.status}`);
      }

      setTreeData((prev) => deleteNode(node.id, prev));

      if (selectedNode?.id === node.id) {
        setSelectedNode(null);
      }

      // alert(`Deleted ${node.name} successfully.`);
      notify(`Deleted ${node.name} successfully.`, "success");
    } catch (error) {
      // console.error("Error deleting entity:", error);
      notify(`Failed to delete ${node.name}. Please try again.`, "error");
    }
  };

  // TreeNode component
  const TreeNode = ({
    node,
    level = 0,
  }: {
    node: TreeNodeType;
    level?: number;
  }) => {
    // Hide rejected nodes when edit visibility is false
    if (
      node.data &&
      node.data.processing_status === "Rejected" &&
      !visibility.edit
    ) {
      return null;
    }

    const hasChildren = (node.children?.length ?? 0) > 0;
    const isExpanded = expandedNodes.has(node.id);
    const config = getNodeConfig(level);
    const Icon = config.icon;
    const status = node.data?.processing_status || "";

    // Filter children to hide rejected nodes when edit visibility is false
    const visibleChildren =
      hasChildren && node.children
        ? node.children.filter(
            (child) =>
              !(child.data.processing_status === "rejected" && !visibility.edit)
          )
        : [];

    const hasVisibleChildren = visibleChildren.length > 0;

    return (
      <div className="relative">
        <div
          className={`flex items-center gap-4 mb-6`}
          style={{ marginLeft: level * 10, cursor: "pointer" }}
          onClick={() => setSelectedNode(node)}
        >
          <div
            className={`relative flex items-center gap-0 p-0 rounded-lg border-2 w-[400px] hover:shadow-md transition-all ${config.border} bg-white`}
          >
            {/* Colored left strip */}
            <div className={`w-2 h-full rounded-l-md ${config.bg}`}></div>

            {/* Main content area */}
            <div className="flex items-center gap-2 p-3 flex-grow">
              {hasVisibleChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(node.id);
                  }}
                  className={`p-1 rounded-full ${config.bg} hover:opacity-80`}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <ChevronDown size={16} className={config.text} />
                  ) : (
                    <ChevronRight size={16} className={config.text} />
                  )}
                </button>
              )}

              <Icon size={16} className={config.text} />
              <span className={`font-medium flex-grow ${config.text}`}>
                {node.name}
              </span>

              <div className="flex items-center gap-1 ml-2">
                <div className="absolute -right-2.5 -top-4">
                  <span
                    className={`px-2 py-1 font-bold rounded-xl text-xs
                    ${
                      {
                        approved: "bg-green-200 text-green-600",
                        rejected: "bg-red-100  text-red-500",
                        pending: "bg-gray-200  text-gray-600",
                        "delete-approval": "bg-orange-100  text-orange-500",
                      }[status.toLowerCase()] || "bg-gray-200  text-gray-600"
                    }
                  `}
                  >
                    {formatStatus(status)}
                  </span>
                </div>
                {/* 
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`View ${node.name}`);
                  }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                >
                  <Edit className="text-primary" size={16} />
                </button> */}
                {visibility.delete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(node);
                    }}
                    className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                  >
                    <Trash2 className="text-red-500" size={16} />
                  </button>
                )}

                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        `Delete ${node.name} and all its children?`
                      )
                    ) {
                      setTreeData((prev) => deleteNode(node.id, prev));
                      if (selectedNode?.id === node.id) {
                        setSelectedNode(null);
                      }
                    }
                  }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                >
                  <Trash2 className="text-red-500" size={16} />
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {hasVisibleChildren && isExpanded && (
          <div
            className={`pl-6 mt-4 border-l-2 ${
              lineColors[level % lineColors.length]
            } border-dashed relative`}
            style={{
              marginLeft: level * 10 + 16,
              minHeight: 40,
              position: "relative",
            }}
          >
            {visibleChildren.map((child) => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  function updateNodeDataInTree(
    tree: TreeNodeType | TreeNodeType[],
    nodeId: string,
    updatedData: TreeNodeType["data"]
  ): TreeNodeType | TreeNodeType[] {
    if (Array.isArray(tree)) {
      return tree.map((node: TreeNodeType): TreeNodeType => {
        if (node.data.entity_id === nodeId) {
          return { ...node, data: { ...updatedData } };
        } else if (node.children) {
          return {
            ...node,
            children: updateNodeDataInTree(
              node.children,
              nodeId,
              updatedData
            ) as TreeNodeType[],
          };
        }
        return node;
      });
    } else {
      if (tree.data.entity_id === nodeId) {
        return { ...tree, data: { ...updatedData } };
      } else if (tree.children) {
        return {
          ...tree,
          children: updateNodeDataInTree(
            tree.children,
            nodeId,
            updatedData
          ) as TreeNodeType[],
        };
      }
      return tree;
    }
  }

  function formatStatus(status: string) {
    return status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-[60vh]">
          {/* <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75"></div> */}
          <LoadingSpinner />
        </div>
      ) : (
        <div className="min-h-screen">
          <div className="w-full">
            <div className="flex space-x-4 w-full">
              {/* Left panel (tree view) */}
              <div className="bg-secondary-color-lt text-secondary-text-dark w-full rounded-lg border border-border p-6">
                <div className="flex justify-between items-center mt-6 border-b border-border mb-8 pb-2">
                  <h2 className="text-[24px] font-semibold">Hierarchy Tree</h2>
                  <div className="flex items-center gap-2 justify-end">
                    {selectedNode &&
                      visibility.approve &&
                      selectedNode.data.processing_status !== "Approved" && (
                        <Button
                          categories="Medium"
                          onClick={() => {
                            updateApprovalStatus(selectedNode.id, "approved");
                            handleApprove(selectedNode.data.entity_id);
                          }}
                          // className="bg-primary hover:bg-primary-hover text-center text-white rounded px-4 py-2 font-bold transition min-w-[4rem]"
                        >
                          Approve
                        </Button>
                      )}
                    {selectedNode &&
                      visibility.reject &&
                      selectedNode.data.processing_status !== "Approved" && (
                        <Button
                          categories="Medium"
                          onClick={() => {
                            updateApprovalStatus(selectedNode.id, "rejected");
                            handleRejectBulk(
                              [selectedNode.data.entity_id]
                              // approvalComment
                            );
                          }}
                          // className="bg-primary hover:bg-primary-hover text-center text-white rounded px-4 py-2 font-bold transition min-w-[4rem]"
                        >
                          Reject
                        </Button>
                      )}
                    <div className="min-w-[150px]">
                      <Button
                        categories="Medium"
                        color="Fade"
                        onClick={toggleAllNodes}
                      >
                        {isAllExpanded ? "Collapse All" : "Expand All"}
                      </Button>
                    </div>
                  </div>
                </div>
                {Array.isArray(treeData) ? (
                  treeData.map((node) => <TreeNode key={node.id} node={node} />)
                ) : treeData ? (
                  <TreeNode node={treeData} />
                ) : (
                  <div className="text-center py-8 text-primary">
                    No hierarchy data available. Create a new one.
                  </div>
                )}
              </div>

              {/* Right panel (details and actions) */}
              <div className="flex flex-col bg-secondary-color-lt w-full space-y-10 rounded-lg border border-border p-6">
                {selectedNode ? (
                  <>
                    <TreeNodeDetails
                      node={selectedNode}
                      onUpdateNode={(updatedData) => {
                        setTreeData((prevTree) => {
                          if (!prevTree) return prevTree;
                          return updateNodeDataInTree(
                            prevTree,
                            selectedNode.id,
                            updatedData
                          );
                        });
                      }}
                    />
                  </>
                ) : (
                  <div className="text-center py-8 text-primary">
                    Select a node to view details
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HierarchicalTree;
