/**
 * Compute the greatest common divisor using Euclid's algorithm.
 *
 * @param {number} num1 - First number.
 * @param {number} num2 - Second number.
 * @returns {number}
 */
export function greatestCommonDivisor(num1: number, num2: number) {
    let number1: number = num1;
    let number2: number = num2;

    while (number1 !== number2) {
        if (number1 > number2) {
            number1 = number1 - number2;
        } else {
            number2 = number2 - number1;
        }
    }

    return number2;
}

/**
 * Calculate least common multiple using gcd.
 *
 * @param {number} num1 - First number.
 * @param {number} num2 - Second number.
 * @returns {number}
 */
export function leastCommonMultiple(num1: number, num2: number) {
    const number1: number = num1;
    const number2: number = num2;

    const gcd: number = greatestCommonDivisor(number1, number2);

    return (number1 * number2) / gcd;
}
