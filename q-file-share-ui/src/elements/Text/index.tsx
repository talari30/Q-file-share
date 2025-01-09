import styles from "./Text.module.css";
import cx from "classnames";

import { ReactNode } from "react";

interface ITextProps {
  children: ReactNode;
  size?: "large" | "medium" | "small";
  className?: string;
}

export const Text = (props: ITextProps): JSX.Element => {
  const { children, size = "medium", className } = props;

  return <p className={cx(styles.text, styles[size], className)}>{children}</p>;
};
