import React, { useContext } from "react";
import { ArcNContext } from "../context/ArcNContext";

const StatusIndicator = () => {
  const { statusMessage } = useContext(ArcNContext);

  return (
    <div className="status-indicator">
      {statusMessage}
    </div>
  );
};

export default StatusIndicator;
