import { Fragment } from "react";
import { Input } from "../base/input";
import { Icons } from "@/lib/icons";
import useBoolean from "@/hook/use-boolean";
import Dialog from "../base/dialog";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const openLogOut = useBoolean(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem("userInfo");
    setTimeout(() => {
      navigate("/sign-in");
    }, 2000);
  };
  return (
    <Fragment>
      <div className="header flex items-center justify-between w-full h-[68px]">
        <div className="w-80">
          <Input
            preIcon={<Icons.search className="text-[var(--primary-300)]" />}
            placeholder="ابحث . . ."
            hideHint={true}
          />
        </div>
        <div className="info-admin flex items-center gap-6">
          <div className="image-admin">
            <img
              src={"/assets/icons/adminPhoto.svg"}
              alt=""
              className="w-12 h-12"
            />
          </div>
          <div className="flex flex-col font-[500]">
            <span className="text-[14px] text-[var(--black)]">Latifa Mho</span>
            <span className="text-[12px] text-[var(--Yellow)]">Legend</span>
          </div>

          <Icons.logout
            onClick={openLogOut.onTrue}
            className="size-5 text-[var(--primary-300)] cursor-pointer"
          />
          <Dialog
            isOpen={openLogOut.value}
            onClose={openLogOut.onFalse}
            cta="تسجيل الخروج"
            title="تسجيل الخروج"
            onSubmit={handleLogout}
          />
        </div>
      </div>
    </Fragment>
  );
};
