// src/utils/pluralize.ts

export function pluralize(word: string): string {
    if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) {
        return word.slice(0, -1) + 'ies';
    }
    if (word.endsWith('s')) {
        return word + 'es';
    }
    return word + 's';
}
