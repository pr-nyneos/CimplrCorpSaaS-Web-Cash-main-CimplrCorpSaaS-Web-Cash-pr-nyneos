import React from "react";
import SectionCard from "../../../components/ui/SectionCard";

export interface AdditionalDetailsResponse {
  remarks?: string;
  narration?: string;
  timestamp?: string;
}

type AdditionalDetailsProps = {
  details: AdditionalDetailsResponse;
  setDetails: React.Dispatch<React.SetStateAction<AdditionalDetailsResponse>>;
  isLoading?: boolean;
};

const AdditionalDetails: React.FC<AdditionalDetailsProps> = ({
  details,
  setDetails,
  // isLoading = false,
}) => {
  return (
    <SectionCard title="Additional Details">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Remarks</label>
          <textarea
            className="border border-border focus:outline-none rounded-md bg-secondary-color-lt text-primary p-2"
            rows={2}
            value={details.remarks || ""}
            onChange={(e) =>
              setDetails((prev) => ({ ...prev, remarks: e.target.value }))
            }
            // disabled={false} 
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Narration</label>
          <textarea
            className="border border-border focus:outline-none rounded-md bg-secondary-color-lt text-primary p-2"
            rows={2}
            value={details.narration || ""}
            onChange={(e) =>
              setDetails((prev) => ({ ...prev, narration: e.target.value }))
            }
            // disabled={false}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            Transaction Timestamp
          </label>
          <div className="h-[37px] border p-2 bg-secondary-color-lt text-secondary-text-dark border-border rounded">
            {details.timestamp}
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default AdditionalDetails;
