import React, { useEffect, useState } from "react";
import LoadingSpinner from "../../../components/layout/LoadingSpinner.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import Button from "../../../components/ui/Button.tsx";
import TreeNode from "../../../components/hierarchy/Hierarcy.tsx";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup.tsx";
import { useForm } from "react-hook-form";
import type { CostProfitCenterData } from "../../../types/masterType";
import nos from "../../../utils/nos.tsx";
import { Trash2 } from "lucide-react";
import { formatToDDMMYYYY } from "../../../utils/dateFormat.ts";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
type ApprovalStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PENDING_DELETE_APPROVAL"
  | "PENDING_EDIT_APPROVAL"
  | "CANCELLED";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type APIResponse = {
  success: boolean;
  updated?: { success: boolean; error?: string }[];
  rows?: { success: boolean; error?: string }[];
  error?: string;
};

type APIResponse2 = {
  success: boolean;
  updated?: { success: boolean; error?: string }[];
  rows?: TreeNodeType[]; // <-- update this line
  error?: string;
};

export type TreeNodeType = {
  id: string;
  name: string;
  data: CostProfitCenterData;
  children?: TreeNodeType[];
};

const AllCashFlowCategories = () => {
  // const [approvalComment, setApprovalComment] = useState("");
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNodeType | null>(null);

  const [loading, setLoading] = useState(true);

  // const { notify, confirm } = useNotification();
  const [treeData, setTreeData] = useState<
    TreeNodeType | TreeNodeType[] | null
  >(null);
  console.log("DATA:", treeData);
  const { notify, confirm } = useNotification();
  const visibility = useAllTabPermissions("cost-profit-center-master");

  useEffect(() => {
    const syncAndFetchHierarchy = async () => {
      try {
        const response = await nos.post<APIResponse2>(
          `${apiBaseUrl}/master/v2/costprofit-center/hierarchy`
        );
        console.log("Hierarchy Response:", response);
        if (Array.isArray(response.data.rows)) {
          setTreeData(response.data.rows);
        } else {
          setTreeData([]);
        }
      } catch (error) {
        // Optionally notify or log error
      } finally {
        setLoading(false);
      }
    };

    syncAndFetchHierarchy();
  }, []);

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
        if (status === "REJECTED") {
          return setStatusForAllDescendants(node, "REJECTED");
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

  interface CostProfitCenterProps {
    centre: {
      data: CostProfitCenterData;
    };
    onUpdateCategory: (updatedData: CostProfitCenterData) => void;
  }

  const CostProfitCenterDetails = ({
    centre,
    onUpdateCategory,
  }: CostProfitCenterProps) => {
    const [editing, setEditing] = React.useState(false);

    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
      watch,
    } = useForm<CostProfitCenterData>({
      defaultValues: {
        centre_name: centre.data.centre_name ?? "",
        centre_code: centre.data.centre_code ?? "",
        centre_level: centre.data.centre_level ?? 0,
        centre_type: centre.data.centre_type ?? "",
        default_currency: centre.data.default_currency ?? "",
        owner: centre.data.owner ?? "",
        owner_email: centre.data.owner_email ?? "",
        entity_name: centre.data.entity_name ?? "",

        status: centre.data.status ?? "",
        effective_from: centre.data.effective_from ?? "",
        effective_to: centre.data.effective_to ?? "",

        checker_by: centre.data.checker_by ?? "",
        checker_at: centre.data.checker_at ?? "",
        checker_comment: centre.data.checker_comment ?? "",

        reason: centre.data.reason ?? "",

        created_by: centre.data.created_by ?? "",
        created_at: centre.data.created_at ?? "",
        edited_by: centre.data.edited_by ?? "",
        edited_at: centre.data.edited_at ?? "",
        deleted_by: centre.data.deleted_by ?? "",
        deleted_at: centre.data.deleted_at ?? "",
      },
    });

    useEffect(() => {
      reset({
        centre_name: centre.data.centre_name ?? "",
        centre_code: centre.data.centre_code ?? "",
        centre_level: centre.data.centre_level ?? 0,
        centre_type: centre.data.centre_type ?? "",
        default_currency: centre.data.default_currency ?? "",
        owner: centre.data.owner ?? "",
        owner_email: centre.data.owner_email ?? "",
        entity_name: centre.data.entity_name ?? "",

        status: centre.data.status ?? "",
        effective_from: centre.data.effective_from
          ? formatToDDMMYYYY(centre.data.effective_from)
          : "",
        effective_to: centre.data.effective_to
          ? formatToDDMMYYYY(centre.data.effective_to)
          : "",

        checker_by: centre.data.checker_by ?? "",
        checker_at: centre.data.checker_at
          ? formatToDDMMYYYY(centre.data.checker_at)
          : "",
        checker_comment: centre.data.checker_comment ?? "",

        reason: centre.data.reason ?? "",

        created_by: centre.data.created_by ?? "",
        created_at: centre.data.created_at
          ? formatToDDMMYYYY(centre.data.created_at)
          : "",
        edited_by: centre.data.edited_by ?? "",
        edited_at: centre.data.edited_at
          ? formatToDDMMYYYY(centre.data.edited_at)
          : "",
        deleted_by: centre.data.deleted_by ?? "",
        deleted_at: centre.data.deleted_at
          ? formatToDDMMYYYY(centre.data.deleted_at)
          : "",
      });

      setEditing(false);
    }, [centre, reset]);

    const handleSave = async (data: CostProfitCenterData) => {
      const result = await confirm(
        `Are you sure you want to approve ${centre.data.centre_name}`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!result.confirmed) return;

      function getChangedFields<T extends object>(
        original: T,
        updated: Partial<T>
      ): Partial<T> {
        return (Object.keys(updated) as Array<keyof T>).reduce((acc, key) => {
          if (updated[key] !== original[key]) {
            acc[key] = updated[key];
          }
          return acc;
        }, {} as Partial<T>);
      }

      // Usage:
      const changedFields = getChangedFields(centre.data, data);

      const payload = {
        rows: [
          {
            centre_id: centre.data.centre_id,
            fields: changedFields,
            reason: result.inputValue || "",
          },
        ],
      };

      try {
        // Simulate API call
        const response = await nos.post<APIResponse>(
          `${apiBaseUrl}/master/v2/costprofit-center/updatebulk`,
          payload
        );

        if (response.data.rows && response.data.rows[0].success) {
          notify(`${centre.data.centre_name} updated successfully!`, "success");
          onUpdateCategory(data);
          setEditing(false);
        } else {
          notify(response.data?.rows?.[0]?.error || "Update failed", "error");
        }
      } catch (error) {
        notify(
          "Failed to update category. Please check your input or try again later.",
          "error"
        );
      }
    };

    // Define options for dropdowns
    const statusOptions = ["Active", "Inactive"];
    // const processingStatusOptions = [
    //   "Pending",
    //   "Approved",
    //   "Rejected",
    //   "In Progress",
    // ];

    return (
      <div className="bg-secondary-color rounded-lg border border-border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-primary font-bold">
            {centre.data.centre_name + ` Cost Profit Center Details` ||
              "Cost Profit Center Details"}
          </h2>

          <div className="w-[5rem] flex justify-end gap-2">
            {visibility.delete && (
              <Button
                categories="Medium"
                color="Fade"
                onClick={() =>
                  handleDelete(centre.data.centre_id, centre.data.centre_name)
                }
              >
                <Trash2 size={18} color="red" />
              </Button>
            )}
            {visibility.edit && (
              <Button
                categories="Medium"
                // color="Fade"
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing ? "Cancel" : "Edit"}
              </Button>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit(handleSave)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <InputGroup
            label="Centre Name"
            name="centre_name"
            register={register}
            readOnlyMode={true}
          />

          <InputGroup
            label="Centre Code"
            name="centre_code"
            register={register}
            readOnlyMode={true}
          />

          <InputGroup
            label="Centre Level"
            name="centre_level"
            register={register}
            type="number"
            readOnlyMode={true}
          />

          <InputGroup
            label="Centre Type"
            name="centre_type"
            register={register}
            errors={errors}
            oldValue={centre.data.old_centre_type}
            readOnlyMode={!editing}
          />

          <InputGroup
            label="Default Currency"
            name="default_currency"
            register={register}
            type="number"
            readOnlyMode={true}
          />

          <InputGroup
            label="Owner / Manager"
            name="owner"
            register={register}
            errors={errors}
            oldValue={centre.data.old_owner}
            readOnlyMode={!editing}
          />

          <InputGroup
            label="Owner Email"
            name="owner_email "
            register={register}
            errors={errors}
            oldValue={centre.data.old_owner_email}
            readOnlyMode={!editing}
          />

          <InputGroup
            label="BU Unit / Entity Name"
            name="entity_name"
            register={register}
            errors={errors}
            oldValue={centre.data.old_entity_name}
            readOnlyMode={!editing}
          />

          <DropdownGroup
            label="Status"
            name="status"
            options={statusOptions}
            register={register}
            errors={errors}
            oldValue={centre.data.old_status}
            watch={watch}
            readOnly={!editing}
          />
          <div className="flex gap-2">
            <InputGroup
              label="Effective From"
              name="effective_from"
              type="date"
              register={register}
              readOnlyMode={!editing}
              oldValue={centre.data.old_effective_from}
            />
            <InputGroup
              label="Effective To"
              name="effective_to"
              type="date"
              register={register}
              oldValue={centre.data.old_effective_to}
              readOnlyMode={!editing}
            />
          </div>
          {centre.data.checker_by &&
            centre.data.processing_status != "PENDING_APPROVAL" && (
              <InputGroup
                label="Checker By"
                name="checker_by"
                register={register}
                errors={errors}
                readOnlyMode={true}
              />
            )}

          {centre.data.checker_at && (
            <InputGroup
              label="Checker At"
              name="checker_at"
              register={register}
              type="date"
              errors={errors}
              readOnlyMode={true}
            />
          )}

          {centre.data.checker_comment && (
            <InputGroup
              label="Checker Comment"
              name="checker_comment"
              register={register}
              maxLength={500}
              errors={errors}
              readOnlyMode={true}
            />
          )}

          <InputGroup
            label="Reason"
            name="reason"
            register={register}
            maxLength={200}
            errors={errors}
            readOnlyMode={true}
          />

          {centre.data.created_by && (
            <InputGroup
              label="Created By"
              name="created_by"
              register={register}
              readOnlyMode={true}
            />
          )}
          {centre.data.created_at && (
            <InputGroup
              label="Created At"
              name="created_at"
              value={formatToDDMMYYYY(centre.data.created_at)}
              // register={register}
              readOnlyMode={true}
            />
          )}
          {centre.data.edited_by && (
            <InputGroup
              label="Edited By"
              name="edited_by"
              register={register}
              readOnlyMode={true}
            />
          )}
          {centre.data.edited_at && (
            <InputGroup
              label="Edited At"
              name="edited_at"
              value={formatToDDMMYYYY(centre.data.edited_at)}
              // register={register}
              readOnlyMode={true}
            />
          )}
          {centre.data.deleted_by && (
            <InputGroup
              label="Deleted By"
              name="deleted_by"
              register={register}
              readOnlyMode={true}
            />
          )}
          {centre.data.deleted_at && (
            <InputGroup
              label="Deleted At"
              name="deleted_at"
              // register={register}
              value={formatToDDMMYYYY(centre.data.deleted_at)}
              readOnlyMode={true}
            />
          )}

          {editing && (
            <div className="col-span-2 flex justify-end mt-4">
              <Button categories="Large" color="Green" type="submit">
                Save
              </Button>
            </div>
          )}
        </form>
      </div>
    );
  };

  const handleApprove = async (centre_id: string, centre_name: string) => {
    try {
      const confirmResult = await confirm(
        `Are you sure you want to approve ${centre_name}`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!confirmResult.confirmed) return;

      const payload = {
        centre_ids: [centre_id],
        comments: confirmResult.inputValue || "",
      };
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/costprofit-center/bulk-approve`,
        payload
      );
      if (response.data.updated && response.data.updated[0].success) {
        throw new Error(`Approval failed. Status: ${response.status}`);
      }
      notify(`${centre_name} approved successfully!`, "success");
    } catch (error) {
      notify("Failed to approve entity. Please try again.", "error");
    }
  };

  const handleReject = async (centre_id: string, centre_name: string) => {
    try {
      const confirmResult = await confirm(
        `Are you sure you want to approve ${centre_name}`,
        {
          input: true,
          inputLabel: "Reject Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!confirmResult.confirmed) return;

      const payload = {
        centre_ids: [centre_id],
        comments: confirmResult.inputValue || "",
      };
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/costprofit-center/bulk-reject`,
        payload
      );
      if (response.data.updated && response.data.updated[0].success) {
        throw new Error(`Rejection failed. Status: ${response.status}`);
      }
      notify(`${centre_name} rejected successfully!`, "success");
    } catch (error) {
      notify("Failed to reject entity. Please try again.", "error");
    }
  };

  const handleDelete = async (centre_id: string, centre_name: string) => {
    try {
      const confirmResult = await confirm(
        `Are you sure you want to delete ${centre_name}`,
        {
          input: true,
          inputLabel: "Delete Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!confirmResult.confirmed) return;

      const payload = {
        centre_ids: [centre_id],
        reason: confirmResult.inputValue || "",
      };
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/v2/costprofit-center/delete`,
        payload
      );
      if (response.data.updated && response.data.updated[0].success) {
        throw new Error(`Deletion failed. Status: ${response.status}`);
      }
      notify(`${centre_name} deleted successfully!`, "success");
    } catch (error) {
      notify("Failed to delete entity. Please try again.", "error");
    }
  };

  function updateNodeDataInTree(
    tree: TreeNodeType | TreeNodeType[],
    nodeId: string,
    updatedData: TreeNodeType["data"]
  ): TreeNodeType | TreeNodeType[] {
    if (Array.isArray(tree)) {
      return tree.map((node: TreeNodeType): TreeNodeType => {
        if (node.data.centre_id === nodeId) {
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
      if (tree.data.centre_id === nodeId) {
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
                            updateApprovalStatus(selectedNode.id, "APPROVED");
                            handleApprove(
                              selectedNode.data.centre_id,
                              selectedNode.data.centre_name
                            );
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
                            updateApprovalStatus(selectedNode.id, "REJECTED");
                            handleReject(
                              selectedNode.data.centre_id,
                              selectedNode.data.centre_name
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
                <div>
                  {Array.isArray(treeData) ? (
                    treeData.map((node) => (
                      <TreeNode<TreeNodeType["data"]>
                        key={node.id}
                        node={node}
                        selectedNode={selectedNode}
                        setSelectedNode={setSelectedNode}
                        treeData={treeData}
                        expandedNodes={expandedNodes}
                        toggleNode={toggleNode}
                      />
                    ))
                  ) : treeData ? (
                    <TreeNode<TreeNodeType["data"]>
                      node={treeData}
                      selectedNode={selectedNode}
                      setSelectedNode={setSelectedNode}
                      treeData={treeData}
                      expandedNodes={expandedNodes}
                      toggleNode={toggleNode}
                    />
                  ) : (
                    <div className="text-center py-8 text-primary">
                      No hierarchy available
                    </div>
                  )}
                </div>
              </div>

              {/* Right panel (details and actions) */}
              <div className="flex flex-col bg-secondary-color-lt w-full space-y-10 rounded-lg border border-border p-6">
                {selectedNode ? (
                  <>
                    <CostProfitCenterDetails
                      centre={{ data: selectedNode.data }}
                      onUpdateCategory={(updatedData) => {
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

export default AllCashFlowCategories;
