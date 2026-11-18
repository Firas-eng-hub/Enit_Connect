import { useTranslation } from 'react-i18next';

/** Translated label for an offer type ("Intership" is the stored value). */
export function useOfferTypeLabel() {
  const { t } = useTranslation();
  return (type: string) => t(`offers.typeLabels.${type}`, { defaultValue: type });
}
