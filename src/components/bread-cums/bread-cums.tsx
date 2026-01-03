import { Icons } from "@/lib/icons";
import { useNavigate } from "react-router-dom";

const BreadCums = ({ head }: { head: string }) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 w-full  p-3.5 bg-[var(--white)] rounded-md">
      <Icons.leftArrow
        className="size-5 cursor-pointer text-[var(--silver)] rotate-180"
        onClick={() => navigate(-1)}
      />
      <h3 className="text-lg font-bold text-[var(--silver)] capitalize">{head}</h3>
    </div>
  );
};

export default BreadCums;
