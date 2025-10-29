import React from "react";
import { QUEUE_TYPES, QueueType } from "../../constants/queueTypes";

interface QueueTypeSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  id?: string;
  name?: string;
  label?: string;
  labelClassName?: string;
}

const QueueTypeSelect: React.FC<QueueTypeSelectProps> = ({
  value,
  onChange,
  className = "",
  id,
  name = "wq_type",
  label,
  labelClassName = "",
}) => {
  return (
    <div>
      {label && (
        <label
          htmlFor={id || name}
          className={`block text-sm font-medium text-gray-300 mb-1 ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <select
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        className={className}
      >
        {QUEUE_TYPES.map((queueType) => (
          <option
            key={queueType}
            value={queueType}
            className="bg-gray-700 text-white"
          >
            {queueType}
          </option>
        ))}
      </select>
    </div>
  );
};

export default QueueTypeSelect;

