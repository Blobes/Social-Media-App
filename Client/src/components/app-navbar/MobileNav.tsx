"use client";
import React from "react";
import { Modal, ModalRef } from "@/components/Modal";
import { useAppContext } from "@/app/AppContext";
import { useContent } from "./Contents";
import { NavBarProps } from "@/types";

interface MobileNavProps extends NavBarProps {
  drawerRef?: React.RefObject<ModalRef>;
  closePopup?: () => void;
}
export const MobileNav: React.FC<MobileNavProps> = ({
  defaultNavList,
  loggedInNavList,
  lastPage: lastPage,
  setLastPage,
  drawerRef = null,
  closePopup,
}) => {
  const { loginStatus } = useAppContext();
  const { MobileNavContent } = useContent();
  const isLoggedIn = loginStatus === "AUTHENTICATED";

  return (
    <Modal
      ref={drawerRef}
      children={{
        contentElement: (
          <MobileNavContent
            list={
              isLoggedIn
                ? [...defaultNavList, ...loggedInNavList]
                : defaultNavList
            }
            lastPage={lastPage}
            setLastPage={setLastPage}
            closePopup={closePopup}
          />
        ),
      }}
      style={{
        overlay: {
          display: {
            xs: "flex",
            md: "none",
          },
        },
      }}
    />
  );
};
