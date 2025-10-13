import React, { useEffect, useState } from "react";
import LoadingSpinner from "../../../components/layout/LoadingSpinner.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import Button from "../../../components/ui/Button.tsx";
import TreeNode from "../../../components/hierarchy/Hierarcy.tsx";
import InputGroup from "../../../components/ui/InputGroup.tsx";
// import DropdownGroup from "../../../components/ui/DropdownGroup.tsx";
import { useForm } from "react-hook-form";
import type { GLAccount } from "../../../types/masterType";
import nos from "../../../utils/nos.tsx";
import { Trash2 } from "lucide-react";
import { formatToDDMMYYYY } from "../../../utils/dateFormat.ts";
// import { gl } from "date-fns/locale";
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
  data: GLAccount;
  children?: TreeNodeType[];
};

const AllGLAccount = () => {
  // const [approvalComment, setApprovalComment] = useState("");
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNodeType | null>(null);
  // const [Visibility, setVisibility] = useState<TabVisibility>({
  //   approve: true,
  //   reject: true,
  //   edit: true,
  // });
  const [loading, setLoading] = useState(true);

  // const { notify, confirm } = useNotification();
  const [treeData, setTreeData] = useState<
    TreeNodeType | TreeNodeType[] | null
  >(null);
  console.log("DATA:", treeData);
  const { notify, confirm } = useNotification();
  const visibility = useAllTabPermissions("gl-account-master");

  useEffect(() => {
    const syncAndFetchHierarchy = async () => {
      try {
        const response = await nos.post<APIResponse2>(
          `${apiBaseUrl}/master/v2/glaccount/hierarchy`
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
      setTreeData(treeData.map(updateStatus)); // <-- uncommented
    } else if (treeData) {
      setTreeData(updateStatus(treeData));
    }
  };

  interface GLAccountProps {
    account: {
      data: GLAccount;
    };
    onUpdateCategory: (updatedData: GLAccount) => void;
  }

  const GLAccountDetails = ({ account, onUpdateCategory }: GLAccountProps) => {
    const [editing, setEditing] = React.useState(false);

    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
      // watch,
    } = useForm<GLAccount>({
      defaultValues: {
        account_class: account.data.account_class ?? "",
        action_id: account.data.action_id ?? "",
        action_type: account.data.action_type ?? "",
        checker_at: account.data.checker_at ?? "",
        checker_by: account.data.checker_by ?? "",
        checker_comment: account.data.checker_comment ?? "",
        created_at: account.data.created_at ?? "",
        created_by: account.data.created_by ?? "",
        default_currency: account.data.default_currency ?? "",
        deleted_at: account.data.deleted_at ?? "",
        deleted_by: account.data.deleted_by ?? "",
        edited_at: account.data.edited_at ?? "",
        edited_by: account.data.edited_by ?? "",
        effective_from: account.data.effective_from ?? "",
        effective_to: account.data.effective_to ?? "",
        erp_type: account.data.erp_type ?? "",
        external_code: account.data.external_code ?? "",
        gl_account_code: account.data.gl_account_code ?? "",
        gl_account_id: account.data.gl_account_id ?? "",
        gl_account_level: account.data.gl_account_level ?? 0,
        gl_account_name: account.data.gl_account_name ?? "",
        gl_account_type: account.data.gl_account_type ?? "",
        is_cash_bank: account.data.is_cash_bank ?? false,
        is_deleted: account.data.is_deleted ?? false,
        is_top_level_gl_account: account.data.is_top_level_gl_account ?? false,
        normal_balance: account.data.normal_balance ?? "",
      },
    });

    useEffect(() => {
      reset({
        account_class: account.data.account_class ?? "",
        action_id: account.data.action_id ?? "",
        action_type: account.data.action_type ?? "",

        checker_by: account.data.checker_by ?? "",
        checker_at: account.data.checker_at
          ? formatToDDMMYYYY(account.data.checker_at)
          : "",
        checker_comment: account.data.checker_comment ?? "",

        created_by: account.data.created_by ?? "",
        created_at: account.data.created_at
          ? formatToDDMMYYYY(account.data.created_at)
          : "",
        edited_by: account.data.edited_by ?? "",
        edited_at: account.data.edited_at
          ? formatToDDMMYYYY(account.data.edited_at)
          : "",
        deleted_by: account.data.deleted_by ?? "",
        deleted_at: account.data.deleted_at
          ? formatToDDMMYYYY(account.data.deleted_at)
          : "",

        default_currency: account.data.default_currency ?? "",
        effective_from: account.data.effective_from
          ? formatToDDMMYYYY(account.data.effective_from)
          : "",
        effective_to: account.data.effective_to
          ? formatToDDMMYYYY(account.data.effective_to)
          : "",

        erp_type: account.data.erp_type ?? "",
        external_code: account.data.external_code ?? "",
        gl_account_code: account.data.gl_account_code ?? "",
        gl_account_id: account.data.gl_account_id ?? "",
        gl_account_level: account.data.gl_account_level ?? 0,
        gl_account_name: account.data.gl_account_name ?? "",
        gl_account_type: account.data.gl_account_type ?? "",

        is_cash_bank: account.data.is_cash_bank ?? false,
        is_deleted: account.data.is_deleted ?? false,
        is_top_level_gl_account: account.data.is_top_level_gl_account ?? false,

        normal_balance: account.data.normal_balance ?? "",
      });

      setEditing(false);
    }, [account, reset]);

    const handleGLAccountSave = async (data: GLAccount) => {
      const result = await confirm(
        `Are you sure you want to approve ${account.data.gl_account_name}`,
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
      const changedFields = getChangedFields(account.data, data);

      const payload = {
        rows: [
          {
            gl_account_id: account.data.gl_account_id,
            fields: changedFields,
            reason: result.inputValue || "",
          },
        ],
      };

      try {
        // Simulate API call
        const response = await nos.post<APIResponse>(
          `${apiBaseUrl}/master/v2/glaccount/updatebulk`,
          payload
        );

        if (response.data.rows && response.data.rows[0].success) {
          notify(
            `${account.data.gl_account_name} updated successfully!`,
            "success"
          );
          onUpdateCategory(data);
          updateApprovalStatus(
            account.data.gl_account_id,
            "PENDING_EDIT_APPROVAL"
          );

          setEditing(false);
        } else {
          notify(response.data?.rows?.[0]?.error || "Update failed", "error");
        }
      } catch (error) {
        notify(
          "Failed to update GL Account. Please check your input or try again later.",
          "error"
        );
      }
    };

    // Define options for dropdowns
    // const statusOptions = ["Active", "Inactive"];

    return (
      <div className="bg-secondary-color rounded-lg border border-border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-primary font-bold">
            {account.data.gl_account_name + ` GL Account Details` ||
              "GL Account Details"}
          </h2>

          <div className="w-[5rem] flex justify-end gap-2">
            {visibility.delete && (
              <Button
                categories="Medium"
                color="Fade"
                onClick={() =>
                  handleGLAccountDelete(
                    account.data.gl_account_id,
                    account.data.gl_account_name
                  )
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
          onSubmit={handleSubmit(handleGLAccountSave)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <InputGroup
            label="GL Account Name"
            name="gl_account_name"
            register={register}
            errors={errors}
            oldValue={account.data.old_gl_account_name}
            readOnlyMode={!editing}
          />

          <InputGroup
            label="GL Account Code"
            name="gl_account_code"
            register={register}
            errors={errors}
            oldValue={account.data.old_gl_account_code}
            readOnlyMode={!editing}
          />

          <InputGroup
            label="GL Account Level"
            name="gl_account_level"
            register={register}
            type="number"
            readOnlyMode={true}
          />

          <InputGroup
            label="GL Account Type"
            name="gl_account_type"
            register={register}
            errors={errors}
            oldValue={account.data.old_gl_account_type}
            readOnlyMode={!editing}
          />

          <InputGroup
            label="Account Class"
            name="account_class"
            register={register}
            errors={errors}
            oldValue={account.data.old_account_class}
            readOnlyMode={!editing}
          />

          <InputGroup
            label="ERP Type"
            name="erp_type"
            register={register}
            errors={errors}
            oldValue={account.data.old_erp_type}
            readOnlyMode={!editing}
          />

          <InputGroup
            label="External Code"
            name="external_code"
            register={register}
            errors={errors}
            oldValue={account.data.old_external_code}
            readOnlyMode={!editing}
          />

          <InputGroup
            label="Default Currency"
            name="default_currency"
            register={register}
            readOnlyMode={true}
          />

          <InputGroup
            label="Normal Balance"
            name="normal_balance"
            register={register}
            errors={errors}
            oldValue={account.data.old_normal_balance}
            readOnlyMode={!editing}
          />

          {/* <div className="flex gap-2"> */}
          <InputGroup
            label="Effective From"
            name="effective_from"
            type="date"
            register={register}
            oldValue={account.data.old_effective_from}
            readOnlyMode={!editing}
          />
          <InputGroup
            label="Effective To"
            name="effective_to"
            type="date"
            register={register}
            oldValue={account.data.old_effective_to}
            readOnlyMode={!editing}
          />
          {/* </div> */}

          {/* <div className="flex gap-2"> */}
          <InputGroup
            label="Is Cash/Bank Account"
            name="is_cash_bank"
            type="checkbox"
            register={register}
            readOnlyMode={!editing}
          />

          <InputGroup
            label="Is Top Level GL Account"
            name="is_top_level_gl_account"
            type="checkbox"
            register={register}
            readOnlyMode={!editing}
          />
          {/* </div> */}

          {/* Boolean fields */}

          {/* Audit fields */}
          {account.data.checker_by && (
            <InputGroup
              label="Checker By"
              name="checker_by"
              register={register}
              readOnlyMode={true}
            />
          )}
          {account.data.checker_at && (
            <InputGroup
              label="Checker At"
              name="checker_at"
              value={formatToDDMMYYYY(account.data.checker_at)}
              readOnlyMode={true}
            />
          )}
          {account.data.checker_comment && (
            <InputGroup
              label="Checker Comment"
              name="checker_comment"
              register={register}
              maxLength={500}
              readOnlyMode={true}
            />
          )}

          {account.data.created_by && (
            <InputGroup
              label="Created By"
              name="created_by"
              register={register}
              readOnlyMode={true}
            />
          )}
          {account.data.created_at && (
            <InputGroup
              label="Created At"
              name="created_at"
              value={formatToDDMMYYYY(account.data.created_at)}
              readOnlyMode={true}
            />
          )}
          {account.data.edited_by && (
            <InputGroup
              label="Edited By"
              name="edited_by"
              register={register}
              readOnlyMode={true}
            />
          )}
          {account.data.edited_at && (
            <InputGroup
              label="Edited At"
              name="edited_at"
              value={formatToDDMMYYYY(account.data.edited_at)}
              readOnlyMode={true}
            />
          )}
          {account.data.deleted_by && (
            <InputGroup
              label="Deleted By"
              name="deleted_by"
              register={register}
              readOnlyMode={true}
            />
          )}
          {account.data.deleted_at && (
            <InputGroup
              label="Deleted At"
              name="deleted_at"
              value={formatToDDMMYYYY(account.data.deleted_at)}
              readOnlyMode={true}
            />
          )}

          {editing && (
            <div className="col-span-3 flex justify-end mt-4">
              <Button categories="Large" color="Green" type="submit">
                Save
              </Button>
            </div>
          )}
        </form>
      </div>
    );
  };

  const handleGLAccountApprove = async (
    gl_account_id: string,
    gl_account_name: string
  ) => {
    if (
      selectedNode &&
      selectedNode.data.processing_status &&
      selectedNode.data.processing_status.toUpperCase() ===
        "PENDING_DELETE_APPROVAL"
    ) {
      notify(
        "You cannot approve a GL Account that is already pending delete approval.",
        "warning"
      );
      return;
    }
    try {
      const confirmResult = await confirm(
        `Are you sure you want to approve ${gl_account_name}`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!confirmResult.confirmed) return;

      const payload = {
        gl_account_ids: [gl_account_id],
        comments: confirmResult.inputValue || "",
      };
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/v2/glaccount/bulk-approve`,
        payload
      );
      if (response.data.updated && response.data.updated[0].success) {
        throw new Error(`Approval failed. Status: ${response.status}`);
      }
      if (response.data.success) {
        notify(`${gl_account_name} approved successfully!`, "success");
        setTreeData((prevTree) => {
          const removeChildrenAndApprove = (
            node: TreeNodeType
          ): TreeNodeType => {
            if (node.data.gl_account_id === gl_account_id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  processing_status: "APPROVED",
                },
                children: undefined, // Remove all children
              };
            }
            if (node.children) {
              return {
                ...node,
                children: node.children.map(removeChildrenAndApprove),
              };
            }
            return node;
          };
          if (Array.isArray(prevTree)) {
            return prevTree.map(removeChildrenAndApprove);
          } else if (prevTree) {
            return removeChildrenAndApprove(prevTree);
          }
          return prevTree;
        });
      }
    } catch (error) {
      notify("Failed to approve GL Account. Please try again.", "error");
    }
  };

  const handleGLAccountReject = async (
    gl_account_id: string,
    gl_account_name: string
  ) => {
    if (
      selectedNode &&
      selectedNode.data.processing_status &&
      selectedNode.data.processing_status.toUpperCase() ===
        "PENDING_DELETE_APPROVAL"
    ) {
      notify(
        "You cannot reject a GL Account that is already pending delete approval.",
        "warning"
      );
      return;
    }
    try {
      const confirmResult = await confirm(
        `Are you sure you want to reject ${gl_account_name}`,
        {
          input: true,
          inputLabel: "Reject Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!confirmResult.confirmed) return;

      const payload = {
        gl_account_ids: [gl_account_id],
        comments: confirmResult.inputValue || "",
      };
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/v2/glaccount/bulk-reject`,
        payload
      );
      if (response.data.updated && response.data.updated[0].success) {
        throw new Error(`Rejection failed. Status: ${response.status}`);
      }
      if (response.data.success) {
        notify(`${gl_account_name} rejected successfully!`, "success");
        updateApprovalStatus(gl_account_id, "REJECTED");
      }
    } catch (error) {
      notify("Failed to reject GL Account. Please try again.", "error");
    }
  };

  const handleGLAccountDelete = async (
    gl_account_id: string,
    gl_account_name: string
  ) => {
    if (
      selectedNode &&
      selectedNode.data.processing_status &&
      selectedNode.data.processing_status.toUpperCase() ===
        "PENDING_DELETE_APPROVAL"
    ) {
      notify(
        "You cannot delete a GL Account that is already pending delete approval.",
        "warning"
      );
      return;
    }
    try {
      const confirmResult = await confirm(
        `Are you sure you want to delete ${gl_account_name}`,
        {
          input: true,
          inputLabel: "Delete Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!confirmResult.confirmed) return;

      const payload = {
        gl_account_ids: [gl_account_id],
        reason: confirmResult.inputValue || "",
      };
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/v2/glaccount/delete`,
        payload
      );
      if (response.data.updated && !response.data.updated[0].success) {
        throw new Error(`Deletion failed. Status: ${response.status}`);
      }
      if (response.data.success) {
        notify(`${gl_account_name} deleted successfully!`, "success");
        updateApprovalStatus(gl_account_id, "PENDING_DELETE_APPROVAL");
      }
    } catch (error) {
      notify("Failed to delete GL Account. Please try again.", "error");
    }
  };

  function updateNodeDataInTree(
    tree: TreeNodeType | TreeNodeType[],
    nodeId: string,
    updatedData: TreeNodeType["data"]
  ): TreeNodeType | TreeNodeType[] {
    if (Array.isArray(tree)) {
      return tree.map((node: TreeNodeType): TreeNodeType => {
        if (node.data.gl_account_id === nodeId) {
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
      if (tree.data.gl_account_id === nodeId) {
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
                    {selectedNode && visibility.approve &&
                      selectedNode.data.processing_status !== "APPROVED" && (
                        <Button
                          categories="Medium"
                          onClick={() => {
                            handleGLAccountApprove(
                              selectedNode.data.gl_account_id,
                              selectedNode.data.gl_account_name
                            );
                          }}
                          // className="bg-primary hover:bg-primary-hover text-center text-white rounded px-4 py-2 font-bold transition min-w-[4rem]"
                        >
                          Approve
                        </Button>
                      )}
                    {selectedNode && visibility.reject &&
                      selectedNode.data.processing_status !== "APPROVED" && (
                        <Button
                          categories="Medium"
                          onClick={() => {
                            handleGLAccountReject(
                              selectedNode.data.gl_account_id,
                              selectedNode.data.gl_account_name
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
                    <GLAccountDetails
                      account={{ data: selectedNode.data }}
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

export default AllGLAccount;
