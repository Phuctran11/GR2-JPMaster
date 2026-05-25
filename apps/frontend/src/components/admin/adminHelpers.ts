export const toNullableNumber = (value: string | number) => {
  if (value === '' || value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export const optionLabel = (options: Array<{ value: string; label: string }>, value?: string | null) =>
  options.find((option) => option.value === value)?.label ?? value ?? '-';
