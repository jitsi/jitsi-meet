/**
 * Generates a random number between 1 and the specified maximum value (inclusive).
 *
 * @param {number} max - The maximum value for the random number (must be a positive integer).
 * @param numberOfDigits - The number of digits to pad the random number with leading zeros.
 * @return {string} The random number formatted with leading zeros if needed.
 */
export function getRandomNumberAsStr(max: number, numberOfDigits: number): string {
    const randomNumber = Math.floor(Math.random() * max) + 1;

    return randomNumber.toString().padStart(numberOfDigits, '0');
}
