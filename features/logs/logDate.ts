export const formatDateForStorage = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseStoredDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(year, month - 1, day);
};
