export function convertLocalPathToUrl(localPath: string): string {
  const fileName = localPath.split("\\ImageStore\\").pop();

  if (!fileName) return "";

  return `http://www.hospitalbase.somee.com/ImageStore/${fileName}`;
}

export function extractImageValue(
  image: File | string | null | undefined
): File | string | null {
  if (image instanceof File) {
    return image;
  }

  if (typeof image === "string") {
    const parts = image.split("/");
    return parts[parts.length - 1];
  }

  return null;
}

export function getUserTypeArabic(type: unknown): string {
  if (type === null || type === undefined) return "غير محدد";
  const value = String(type).toLowerCase();
  switch (value) {
    case "0":
    case "admin":
      return "مدير";
    case "1":
    case "dataentry":
    case "data entry":
      return "مدخل بيانات";
    case "2":
    case "rep":
      return "مندوب";
    case "3":
    case "doctor":
    case "dr":
      return "طبيب";
    case "4":
    case "rep_dataentry":
    case "rep dataentry":
      return "مندوب ومدخل بيانات";
    case "5":
    case "rep_b":
    case "rep b":
      return "مندوبB";
    default:
      return String(type);
  }
}

export function normalizeUserTypeToCode(
  type: unknown
): "0" | "1" | "2" | "3" | "4" | "5" {
  if (type === null || type === undefined) return "0";
  const value = String(type).toLowerCase();

  if (["0", "1", "2", "3", "4", "5"].includes(value)) {
    return value as "0" | "1" | "2" | "3" | "4" | "5";
  }

  if (value === "admin") return "0";
  if (value === "dataentry" || value === "data entry") return "1";
  if (value === "rep") return "2";
  if (value === "doctor" || value === "dr") return "3";
  if (value === "rep_b" || value === "rep b") return "5";

  if (
    value === "rep_dataentry" ||
    value === "rep dataentry" ||
    (value.includes("rep") && value.includes("dataentry")) ||
    (value.includes("rep") && value.includes("data entry"))
  ) {
    return "4";
  }

  return "0";
}
