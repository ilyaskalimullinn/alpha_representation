import { unparse } from "papaparse";

export const copyToClipboard = (value) => {
    navigator.clipboard.writeText(`${value}`);
};

export const generateAllSigma = (n) => {
    const total = Math.pow(2, n);
    const result = [];

    for (let i = 0; i < total; i++) {
        const combination = [];
        for (let j = n - 1; j >= 0; j--) {
            // Changed to decrement
            // Check each bit position (right to left)
            combination.push(i & (1 << j) ? 1 : -1);
        }
        result.push(combination);
    }

    return result;
};

export const generateAllX = (n) => {
    const total = Math.pow(3, n);
    const result = [];

    for (let i = 0; i < total; i++) {
        const combination = [];
        let current = i;

        for (let j = 0; j < n; j++) {
            const digit = current % 3;
            // Map 0 -> -1, 1 -> 0, 2 -> 1
            combination.unshift(digit - 1);
            current = Math.floor(current / 3);
        }

        result.push(combination);
    }

    return result;
};

export const downloadCSV = (data, columns, filename) => {
    // Convert data to CSV format

    let csv =
        unparse({ fields: columns, data: [] }) +
        unparse(data, { header: false });

    // Create a download link
    const link = document.createElement("a");
    link.setAttribute(
        "href",
        "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    link.setAttribute("download", filename); // Set the filename

    // Programmatically trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Clean up
};
