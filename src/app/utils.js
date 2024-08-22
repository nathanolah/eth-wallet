import { formatUnits } from "ethers";
// Wei: (10^18), Wei is often associated with precise calculations (used in smart contracts).
// Gwei: (10^9), Gwei is often associated with gas calculations.

export const formatWeiAmount = (amount, decimals) => {
    amount = formatUnits(amount, decimals);

    // Add commas into amount
    return new Intl.NumberFormat(
        "en-US",
        {maximumFractionDigits: decimals}
    ).format(amount);
};