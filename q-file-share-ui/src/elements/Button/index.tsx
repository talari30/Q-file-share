import styles from "./Button.module.css";
import cx from "classnames";

import { ReactNode } from "react";

interface IButtonProps {
  id: string;
  className?: string;
  children: ReactNode;
  type?: "submit" | "reset" | "button" | undefined;
  variant?: "primary" | "secondary" | "text";
  onClickAction?: () => void;
}

export const Button = (props: IButtonProps): JSX.Element => {
  const {
    id,
    className,
    children,
    type = "button",
    variant = "primary",
    onClickAction,
  } = props;

  return (
    <button
      id={id}
      className={cx(styles.button, styles[variant], className)}
      type={type}
      onClick={onClickAction}
    >
      {children}
    </button>
  );
};
