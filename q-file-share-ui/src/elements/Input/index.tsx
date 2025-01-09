import styles from "./Input.module.css";

import { RefObject } from "react";

interface IInputProps {
  id: string;
  className?: string;
  name?: string;
  ref?: RefObject<HTMLInputElement>;
  type?: "text" | "number" | "email" | "password" | "checkbox";
  value?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  onClickAction?: () => void;
}

import React, { forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, IInputProps>(
  (props, ref): JSX.Element => {
    const {
      id,
      className,
      name = "",
      type = "text",
      value,
      placeholder = "",
      required = false,
      readOnly = false,
      onClickAction,
    } = props;

    return (
      <div className={className}>
        <input
          id={id}
          name={name}
          className={styles.input}
          ref={ref}
          type={type}
          value={value}
          placeholder={type !== "checkbox" ? placeholder : ""}
          required={required}
          readOnly={readOnly}
          onClick={onClickAction}
        />
        {type === "checkbox" && <label htmlFor={id}>{placeholder}</label>}
      </div>
    );
  },
);
