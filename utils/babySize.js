import table from '../data/fetalWeight50th';

export const getBabySize = (weeks) => {
  const weightG  = table[weeks] ?? null;
  const fruit = [
    'lime', 'avocado', 'mango', 'coconut', 'papaya', 'pineapple',
    'watermelon',
  ][Math.min(Math.floor((weeks - 12) / 4), 6)] ?? '';
  return {
    weightG,
    weightLb: weightG ? (weightG / 453.592).toFixed(2) : null,
    fruit,
  };
};
