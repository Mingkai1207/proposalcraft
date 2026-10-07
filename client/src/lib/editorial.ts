import { useTranslation } from "react-i18next";

export function useEditorialCopy() {
  const { i18n } = useTranslation();
  return (english: string, chinese: string) =>
    i18n.language.startsWith("zh") ? chinese : english;
}
