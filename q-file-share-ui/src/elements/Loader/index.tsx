import styles from "./Loader.module.css";
import cx from "classnames";

interface ILoaderProps {
  className?: string;
  isStatic?: boolean;
}
export const Loader = (props: ILoaderProps): JSX.Element => {
  const { className, isStatic = false } = props;

  return (
    <span
      className={cx(isStatic ? styles.static : styles.loader, props?.className)}
    />
  );
};
