import styles from "./NavBar.module.css";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/elements";
import { removeAuthToken } from "@/utils";

import qfsLogo from "@/assets/qfs-logo.svg";
import logoutLogo from "@/assets/logout.svg";

interface PageDetail {
  pageName?: string;
  pageURL?: string;
}

interface INavBarProps {
  pageName1?: string;
  pageURL1?: string;
  pageName2?: string;
  pageURL2?: string;
  showLogo?: boolean;
}

export const NavBar = (props: INavBarProps): JSX.Element => {
  const { pageName1, pageURL1, pageName2, pageURL2, showLogo = true } = props;

  const router = useRouter();

  const pageDetails: PageDetail[] = [
    { pageName: pageName1, pageURL: pageURL1 },
    { pageName: pageName2, pageURL: pageURL2 },
  ];

  const handleLogOut = (): void => {
    removeAuthToken();
    router.replace("/login");
  };

  return (
    <div className={styles.container}>
      {showLogo && (
        <div
          className={styles.navbarLogo}
          onClick={() => {
            router.push("/dashboard");
          }}
        >
          <Image src={qfsLogo} alt="qfs-logo" width={55} height={55} priority />
        </div>
      )}
      <div className={styles.navbarText}>
        {pageDetails.map(({ pageName, pageURL }: PageDetail, index: number) => (
          <Button
            key={index}
            id="navbar-button"
            className={styles.navbarButton}
            variant="text"
            onClickAction={() => router.push(pageURL || "")}
          >
            {pageName}
          </Button>
        ))}
        <div className={styles.logout} onClick={handleLogOut}>
          <Image
            src={logoutLogo}
            alt="QFS Logo"
            width={30}
            height={30}
            priority
          />
        </div>
      </div>
    </div>
  );
};
