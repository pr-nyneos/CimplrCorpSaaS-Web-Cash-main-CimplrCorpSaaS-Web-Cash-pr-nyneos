export function getProcessingStatusColor(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "PENDING_APPROVAL":
    case "PENDING_EDIT_APPROVAL":
    case "PENDING_DELETE_APPROVAL":
    case "PENDING_CONFIRMATION":
    case "PENDING CONFIRMATION":
      return "bg-yellow-100 text-yellow-800";
    case "PENDING_ROLLOVER":
    case "PENDING ROLLOVER":
      return "bg-amber-100 text-amber-800";
    case "PENDING_CANCELLATION":
    case "PENDING CANCELLATION":
      return "bg-orange-100 text-orange-800";
    case "DELETE-APPROVAL":
      return "bg-orange-100 text-orange-800";
    case "AWAITING-APPROVAL":
      return "bg-blue-100 text-blue-800";
    case "ROLLED_OVER":
    case "ROLLED OVER":
      return "bg-blue-100 text-blue-800";
    case "CONFIRMED":
      return "bg-emerald-100 text-emerald-800";
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "PARTIALLY_CANCELLED":
    case "PARTIALLY CANCELLED":
    case "PARTIALLU_CANCELLED":
    case "PARTIALLU CANCELLED":
      return "bg-purple-100 text-purple-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}