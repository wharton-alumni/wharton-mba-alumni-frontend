export const topBatches = ["WEMBA'52", "WEMBA'51", "WEMBA'50"];

export const olderBatches = Array.from({ length: 49 }, (_, index) => `WEMBA'${49 - index}`);

export const allBatches = [...topBatches, ...olderBatches];
