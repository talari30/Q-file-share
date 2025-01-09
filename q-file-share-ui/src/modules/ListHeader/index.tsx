import styles from "./ListHeader.module.css";

import { Heading } from "@/elements";

interface ListHeaderProps {
  title: string;
}

export const ListHeader: React.FC<ListHeaderProps> = (props): JSX.Element => {
  const { title } = props;
  return (
    <div className={styles.listHeader}>
      <Heading size={2}>{title}</Heading>
    </div>
  );
};
