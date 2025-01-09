import styles from "./Heading.module.css";
import cx from "classnames";

import { ReactNode } from "react";

interface IHeaderProps {
  children: ReactNode;
  className?: string;
  size?: 1 | 2 | 3 | 4;
}

export const Heading = (props: IHeaderProps): JSX.Element => {
  const { children, className, size = 1 } = props;
  const HeadingTag = `h${size}` as keyof JSX.IntrinsicElements;

  return (
    <HeadingTag className={cx(styles.heading, className)}>
      {children}
    </HeadingTag>
  );
};
