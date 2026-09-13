export interface CategoryDonutItem {
  categoryId: string;
  name: string;
  color: string;
  value: number;
}

const OTHERS_COLOR = "#64748b";

export const groupSmallCategories = (
  data: CategoryDonutItem[],
  maxSlices = 8,
): CategoryDonutItem[] => {
  if (data.length <= maxSlices) return data;

  const head = data.slice(0, maxSlices - 1);
  const tail = data.slice(maxSlices - 1);
  const othersValue = tail.reduce((sum, item) => sum + item.value, 0);

  return [
    ...head,
    {
      categoryId: "others",
      name: "Otros",
      color: OTHERS_COLOR,
      value: othersValue,
    },
  ];
};
