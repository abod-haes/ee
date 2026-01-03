import { FiLogOut } from "react-icons/fi";
import {
  IoSearch,
  IoClose,
  IoChevronDown,
  IoMenu,
  IoImageOutline,
  IoCheckmarkCircle,
  IoBan,
  IoCalendarOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoChevronBack,
  IoChevronForward,
} from "react-icons/io5";
import { TfiArrowCircleLeft } from "react-icons/tfi";
import { RiDeleteBin6Fill, RiEdit2Fill, RiDraftLine } from "react-icons/ri";
import { FiFilter } from "react-icons/fi";
import { RiAddLargeFill } from "react-icons/ri";
import { BsSortDown } from "react-icons/bs";
import { PiFlowerTulipBold } from "react-icons/pi";
import { HiOutlineLogout } from "react-icons/hi";
import { MdOutlineHealthAndSafety, MdUploadFile } from "react-icons/md";
import { BsQrCode, BsPrinter } from "react-icons/bs";

export const Icons = {
  search: IoSearch,
  close: IoClose,
  menu: IoMenu,
  logout: FiLogOut,
  leftArrow: TfiArrowCircleLeft,
  chevronLeft: IoChevronBack,
  chevronRight: IoChevronForward,
  delete: RiDeleteBin6Fill,
  edit: RiEdit2Fill,
  filter: FiFilter,
  add: RiAddLargeFill,
  sort: BsSortDown,
  flower: PiFlowerTulipBold,
  logOut: HiOutlineLogout,
  health: MdOutlineHealthAndSafety,
  upload: MdUploadFile,
  addDate: RiDraftLine,
  chevronDown: IoChevronDown,
  image: IoImageOutline,
  check: IoCheckmarkCircle,
  ban: IoBan,
  calendar: IoCalendarOutline,
  view: IoEyeOutline,
  eyeOff: IoEyeOffOutline,
  qrCode: BsQrCode,
  printer: BsPrinter,
};
