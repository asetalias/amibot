/**
 * Find and return the first non-empty among the strings passed.
 * @param {Array<string>} vals
 */
export const firstNonEmpty = (...vals) => {
    for ( const str of vals) {
        if ((str ?? "") !== "") {
            return str;
        }
    }
    return "";
} 