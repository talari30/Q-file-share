import styles from "./Card.module.css";

import Image from "next/image";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

import { Heading, Text } from "@/elements";

interface ICardProps {
  id?: string;
  className?: string;
  title: string;
  description: string;
  src: StaticImport;
  onClickHandler?: () => void;
}

export const Card = (props: ICardProps): JSX.Element => {
  const { title, description, src, onClickHandler } = props;

  return (
    <div className={styles.card} onClick={onClickHandler}>
      <Image
        src={src}
        alt={`${title}-image`}
        className={styles.cardLogo}
        width={40}
        height={40}
      />
      <Heading size={3}>{title}</Heading>
      <Text size="small">{description}</Text>
    </div>
  );
};
